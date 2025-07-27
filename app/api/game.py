from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.database import GameEvent, Game
from app.schemas.schemas import GameEventRequest, GameScoreRequest, GlobalScoreRequest, GlobalEventRequest
from app.services.websocket_manager import manager
from app.services.score_prediction import score_predictor
from app.core.config import config

router = APIRouter()

@router.post("/{game_id}/event")
async def create_game_event(
    game_id: str,
    event_data: GameEventRequest,
    db: Session = Depends(get_db)
):
    """
    创建游戏事件
    
    Args:
        game_id: 游戏唯一标识符
        event_data: 事件数据(玩家、队伍、事件类型、附加信息)
        db: 数据库会话
        
    Returns:
        包含分数预测的响应
    """
    # 查找或创建游戏记录
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        game = Game(id=game_id, name=game_id, round_number=1, tournament_id=1)
        db.add(game)
        db.commit()
    
    # 创建游戏事件记录
    game_event = GameEvent(
        game_id=game_id,
        player=event_data.player,
        team=event_data.team,
        event=event_data.event,
        lore=event_data.lore
    )
    
    db.add(game_event)
    db.commit()
    db.refresh(game_event)
    
    # 处理分数预测（基于游戏规则和轮次权重）
    prediction_result = score_predictor.process_event(game_id, {
        "event": event_data.event,
        "player": event_data.player,
        "team": event_data.team,
        "lore": event_data.lore
    })
    
    # 通过WebSocket广播事件和分数预测
    await manager.broadcast_game_event(game_id, {
        "player": event_data.player,
        "team": event_data.team,
        "event": event_data.event,
        "lore": event_data.lore,
        "timestamp": game_event.timestamp.isoformat(),
        "score_predictions": prediction_result.get("score_predictions", {}),
        "predicted_scores": prediction_result.get("total_predicted_scores", {})
    })
    
    # 更新积分榜数据
    await manager.update_leaderboard_from_database()
    
    return {
        "status": "success", 
        "message": "Event recorded",
        "score_predictions": prediction_result.get("score_predictions", {}),
        "predicted_scores": prediction_result.get("total_predicted_scores", {})
    }

@router.post("/{game_id}/score")
async def update_game_scores(
    game_id: str,
    scores: List[GameScoreRequest],
    db: Session = Depends(get_db)
):
    """
    更新游戏分数（支持积分权重和万能替补）
    
    Args:
        game_id: 游戏标识符
        scores: 分数列表（玩家、队伍、分数）
        db: 数据库会话
        
    Returns:
        包含分数对比的响应
    """
    # 查找或创建游戏记录
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        game = Game(id=game_id, name=game_id, round_number=1, tournament_id=1)
        db.add(game)
        db.commit()
    
    # 获取当前轮次以计算积分权重
    current_round = game.round_number
    round_multiplier = config.get_round_multiplier(current_round)
    
    score_updates = []
    actual_scores = {}
    
    # 处理每个玩家的分数，应用积分权重
    for score_data in scores:
        # 计算加权分数
        weighted_score = config.calculate_weighted_score(score_data.score, current_round)
        
        score_updates.append({
            "player": score_data.player,
            "team": score_data.team,
            "base_score": score_data.score,  # 原始分数
            "weighted_score": weighted_score,  # 加权分数
            "round": current_round,
            "multiplier": round_multiplier
        })
        
        # 存储实际分数用于预测对比
        actual_scores[score_data.player] = weighted_score
    
    # 更新分数预测器的实际分数
    score_predictor.update_actual_scores(game_id, actual_scores)
    
    # 获取预测对比结果
    score_comparison = score_predictor.get_score_comparison(game_id)
    
    # 通过WebSocket广播分数更新
    await manager.broadcast_score_update({
        "game_id": game_id,
        "scores": score_updates,
        "score_comparison": score_comparison,
        "round_info": {
            "round": current_round,
            "multiplier": round_multiplier
        }
    })
    
    # 更新积分榜数据
    await manager.update_leaderboard_from_database()
    
    return {
        "status": "success", 
        "message": "Scores updated with round multiplier",
        "round_multiplier": round_multiplier,
        "score_comparison": score_comparison
    }

@router.post("/{game_id}/initialize")
async def initialize_game(
    game_id: str,
    teams: List[str],
    players: dict,  # {"team_id": ["player1", "player2", ...]}
    round_number: int = 1,  # 新增轮次参数
    db: Session = Depends(get_db)
):
    """
    初始化游戏以进行分数预测
    支持万能替补：同一玩家可能在不同游戏中属于不同队伍
    
    Args:
        game_id: 游戏标识符
        teams: 参与的队伍列表
        players: 队伍和玩家的映射关系
        round_number: 当前轮次（用于积分权重）
        db: 数据库会话
    """
    # 查找或创建游戏记录
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        game = Game(id=game_id, name=game_id, round_number=round_number, tournament_id=1)
        db.add(game)
    else:
        # 更新轮次信息
        game.round_number = round_number
    
    db.commit()
    
    # 初始化分数预测引擎
    score_predictor.initialize_game(game_id, teams, players)
    
    # 获取当前轮次的积分权重
    round_multiplier = config.get_round_multiplier(round_number)
    
    return {
        "status": "success",
        "message": f"Game {game_id} initialized for score prediction",
        "teams": teams,
        "players": players,
        "round": round_number,
        "multiplier": round_multiplier
    }

@router.get("/{game_id}/predictions")
async def get_score_predictions(game_id: str):
    """获取当前的分数预测"""
    score_comparison = score_predictor.get_score_comparison(game_id)
    return {
        "game_id": game_id,
        "score_comparison": score_comparison
    }

@router.post("/game/score")
async def update_global_scores(
    scores: List[GlobalScoreRequest],
    db: Session = Depends(get_db)
):
    """
    更新全局分数（支持万能替补玩家系统）
    玩家可能在不同时间属于不同队伍，以POST数据为准
    
    Args:
        scores: 全局分数数据
        db: 数据库会话
    """
    from app.core.database import Team, Player
    
    # 处理每个队伍的数据
    for team_data in scores:
        # 查找或创建队伍
        team = db.query(Team).filter(Team.id == team_data.team).first()
        if not team:
            team = Team(id=team_data.team, name=team_data.team, tournament_id=1)
            db.add(team)
        
        # 更新队伍总分
        team.total_score = team_data.total_score
        
        # 处理队伍内每个玩家的分数
        for player_score in team_data.scores:
            # 查找玩家，如果不存在则创建
            # 注意：万能替补玩家可能之前属于其他队伍
            player = db.query(Player).filter(Player.id == player_score.player).first()
            if not player:
                # 创建新玩家记录
                player = Player(
                    id=player_score.player, 
                    name=player_score.player, 
                    team_id=team_data.team
                )
                db.add(player)
            else:
                # 更新玩家的队伍归属（万能替补）
                player.team_id = team_data.team
            
            # 更新玩家分数
            player.score = player_score.score
    
    db.commit()
    
    # 通过WebSocket广播全局分数更新
    await manager.broadcast_score_update({
        "type": "global",
        "teams": [
            {
                "team": team_data.team,
                "total_score": team_data.total_score,
                "players": [
                    {"player": p.player, "score": p.score} 
                    for p in team_data.scores
                ]
            }
            for team_data in scores
        ]
    })
    
    # 更新积分榜数据
    await manager.update_leaderboard_from_database()
    
    return {"status": "success", "message": "Global scores updated"}

@router.post("/game/event")
async def create_global_event(
    event_data: GlobalEventRequest,
    db: Session = Depends(get_db)
):
    """
    创建全局事件（游戏状态变更）
    
    Args:
        event_data: 全局事件数据
        db: 数据库会话
    """
    from app.core.database import Tournament
    
    # 查找或创建锦标赛记录
    tournament = db.query(Tournament).first()
    if not tournament:
        current_game = event_data.game.name if event_data.game else ""
        current_round = event_data.game.round if event_data.game else 1
        tournament = Tournament(
            name="Minecraft Tournament",
            status=event_data.status,
            current_game=current_game,
            current_round=current_round
        )
        db.add(tournament)
    else:
        # 更新锦标赛状态
        tournament.status = event_data.status
        if event_data.game:
            tournament.current_game = event_data.game.name
            tournament.current_round = event_data.game.round
    
    db.commit()
    
    # 获取当前轮次的积分权重信息（如果有game信息）
    round_multiplier = 1.0
    if event_data.game:
        round_multiplier = config.get_round_multiplier(event_data.game.round)
    
    # 通过WebSocket广播全局事件
    broadcast_data = {
        "status": event_data.status,
        "round_multiplier": round_multiplier
    }
    
    # 如果有game信息，则包含在广播中
    if event_data.game:
        broadcast_data["game"] = {
            "name": event_data.game.name,
            "round": event_data.game.round
        }
    
    await manager.broadcast_global_event(broadcast_data)
    
    return {"status": "success", "message": "Global event updated"}