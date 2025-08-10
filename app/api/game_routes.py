"""
游戏路由模块
处理特定游戏的事件和分数更新API端点
"""

from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import GameEvent, ScoreUpdate, BingoCard
from app.core.websocket import connection_manager
from app.core.game_config import game_config
from app.core.score_engine import score_engine
from app.core.data_manager import data_manager
from datetime import datetime
from app.core.websocket import connection_manager

# 创建路由器实例
router = APIRouter()


@router.post("/api/{game_id}/event")
async def handle_game_event(game_id: str, event: GameEvent):
    """
    处理特定游戏的事件
    
    参数:
        game_id (str): 游戏的唯一标识符
        event (GameEvent): 游戏事件数据
    
    返回:
        dict: 包含处理结果的响应信息
    """
    try:
        print(f"游戏 {game_id} - 事件: {event.event}, 玩家: {event.player}, 队伍: {event.team}, 详情: {event.lore}")
        
        # 设置当前游戏（如果改变了）
        if score_engine.current_game_id != game_id:
            score_engine.set_current_game(game_id)
        
        # 处理事件并获取分数预测
        score_prediction = score_engine.process_event({
            "player": event.player,
            "team": event.team,
            "event": event.event,
            "lore": event.lore
        })
        
        # 添加事件到数据管理器（带时间戳）
        data_manager.add_event(event, game_id)
        
        # 更新当前游戏积分数据
        if score_prediction:
            data_manager.update_current_game_score(score_prediction)
        
        # 通过WebSocket广播单条事件（含分数预测），便于前端即时更新
        try:
            # 取队伍颜色
            teams_cfg = game_config.get_teams()
            id_to_color = {t['id']: t.get('color') for t in teams_cfg}
            team_color = id_to_color.get(event.team)
            websocket_message = {
                "type": "game_event",
                "game_id": game_id,
                "data": {
                    "player": event.player,
                    "team": event.team,
                    "event": event.event,
                    "lore": event.lore,
                    "team_color": team_color,
                    "game_id": game_id,
                    "timestamp": datetime.now().isoformat()
                },
                "score_prediction": score_prediction,
                "timestamp": datetime.now().isoformat()
            }
            await connection_manager.broadcast(websocket_message)
        except Exception as be:
            print(f"广播游戏事件失败: {be}")

        # 准备响应数据
        response_data = {
            "message": "游戏事件处理成功",
            "success": True,
            "game_id": game_id,
            "timestamp": datetime.now().isoformat()
        }
        
        return response_data
    except Exception as e:
        print(f"处理游戏事件时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理游戏事件失败: {str(e)}")


@router.post("/api/{game_id}/score")
async def handle_game_score_update(game_id: str, scores: List[ScoreUpdate]):
    """
    处理特定游戏的分数更新
    
    参数:
        game_id (str): 游戏的唯一标识符
        scores (List[ScoreUpdate]): 分数更新数据列表
    
    返回:
        dict: 包含处理结果的响应信息
    """
    try:
        print(f"游戏 {game_id} - 分数更新:")
        for score in scores:
            print(f"  玩家: {score.player}, 队伍: {score.team}, 分数: {score.score}")
        
        # 准备响应数据
        response_data = {
            "message": "游戏分数更新处理成功",
            "success": True,
            "game_id": game_id,
            "total_updates": len(scores),
            "scores": [
                {
                    "player": score.player,
                    "team": score.team,
                    "score": score.score
                } for score in scores
            ]
        }
        
        # 通过WebSocket广播分数更新
        websocket_message = {
            "type": "game_score_update",
            "game_id": game_id,
            "data": {
                "total_updates": len(scores),
                "scores": [
                    {
                        "player": score.player,
                        "team": score.team,
                        "score": score.score
                    } for score in scores
                ]
            },
            "timestamp": datetime.now().isoformat()
        }
        await connection_manager.broadcast(websocket_message)
        
        return response_data
    except Exception as e:
        print(f"处理游戏分数更新时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理游戏分数更新失败: {str(e)}")


@router.get("/api/{game_id}/leaderboard")
async def get_current_leaderboard(game_id: str):
    """
    获取当前游戏的实时分数榜
    
    参数:
        game_id (str): 游戏的唯一标识符
    
    返回:
        dict: 当前分数榜数据
    """
    try:
        # 确保分数引擎设置了正确的游戏
        if score_engine.current_game_id != game_id:
            score_engine.set_current_game(game_id)
        
        leaderboard = score_engine.get_current_standings()
        
        return {
            "message": "获取分数榜成功",
            "success": True,
            "game_id": game_id,
            "leaderboard": leaderboard
        }
    except Exception as e:
        print(f"获取分数榜时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取分数榜失败: {str(e)}")


@router.post("/api/{game_id}/set_round")
async def set_game_round(game_id: str, round_data: dict):
    """
    设置当前游戏回合
    
    参数:
        game_id (str): 游戏的唯一标识符
        round_data (dict): 包含round字段的数据
    
    返回:
        dict: 设置结果
    """
    try:
        round_num = round_data.get('round', 1)
        score_engine.set_current_game(game_id, round_num)
        
        # 通过WebSocket广播游戏回合变更
        websocket_message = {
            "type": "game_round_change",
            "game_id": game_id,
            "round": round_num,
            "timestamp": datetime.now().isoformat()
        }
        await connection_manager.broadcast(websocket_message)
        
        return {
            "message": f"游戏 {game_id} 回合设置为 {round_num}",
            "success": True,
            "game_id": game_id,
            "round": round_num
        }
    except Exception as e:
        print(f"设置游戏回合时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"设置游戏回合失败: {str(e)}")


@router.post("/api/bingo/card")
async def post_bingo_card(card: BingoCard):
    """
    接收 Bingo 卡片数据（来自插件），并通过 WebSocket 广播给前端。
    符合示例 JSON 结构：
    - 顶层: size, width, height, team(可选), tasks(键为"x,y"), timestamp(ms)
    - tasks 每项含: index, x, y, name, type, description, material(可选), count(可选)
    """
    try:
        # 存储到数据管理器
        data_manager.update_bingo_card(card)

        # 通过WebSocket进行一次即时广播（含完整数据，保证前端及时显示）
        complete_data = data_manager.get_complete_data()
        await connection_manager.broadcast(complete_data)

        return {
            "message": "Bingo 卡片接收成功",
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"接收 Bingo 卡片时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"接收 Bingo 卡片失败: {str(e)}")