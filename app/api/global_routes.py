"""
全局路由模块
处理全局分数更新、全局事件和投票事件API端点
"""

from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import TeamScore, GlobalEvent, VoteEvent
from app.core.websocket import connection_manager
from app.core.tournament_manager import tournament_manager
from app.core.data_manager import data_manager
from datetime import datetime

# 创建路由器实例
router = APIRouter()


@router.post("/api/game/score")
async def handle_global_score_update(team_scores: List[TeamScore]):
    """
    处理全局分数更新
    
    参数:
        team_scores (List[TeamScore]): 队伍分数数据列表
    
    返回:
        dict: 包含处理结果的响应信息
    """
    try:
        print("全局分数更新:")
        for team_score in team_scores:
            print(f"  队伍: {team_score.team}, 总分: {team_score.total_score}")
            for player_score in team_score.scores:
                print(f"    玩家: {player_score.player}, 分数: {player_score.score}")
        
        # 补充队伍颜色（若未传入），从配置读取
        from app.core.game_config import game_config
        team_color_map = {t['id']: t.get('color') for t in game_config.get_teams()}
        for ts in team_scores:
            if not getattr(ts, 'color', None):
                setattr(ts, 'color', team_color_map.get(ts.team))

        # 更新数据管理器中的全局积分数据
        data_manager.update_global_scores(team_scores)
        
        # 准备响应数据
        response_data = {
            "message": "全局分数更新处理成功",
            "success": True,
            "total_teams": len(team_scores),
            "timestamp": datetime.now().isoformat()
        }
        
        return response_data
    except Exception as e:
        print(f"处理全局分数更新时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理全局分数更新失败: {str(e)}")


@router.post("/api/game/event")
async def handle_global_event(event: GlobalEvent):
    """
    处理全局事件
    
    参数:
        event (GlobalEvent): 全局事件数据
    
    返回:
        dict: 包含处理结果的响应信息
    """
    try:
        if event.game:
            print(f"全局事件 - 状态: {event.status}, 游戏: {event.game.name}, 回合: {event.game.round}")
        else:
            print(f"全局事件 - 状态: {event.status}, 无具体游戏信息")
        
        # 如果状态是gaming，只设置当前游戏，不自动添加到选中列表
        if event.status == "gaming" and event.game:
            tournament_manager.current_game = event.game.name
        
        # 更新数据管理器中的游戏状态
        data_manager.update_game_status(event)

        # 通过WebSocket广播全局事件，确保前端状态及时更新
        try:
            await connection_manager.broadcast({
                "type": "global_event",
                "data": data_manager.game_status,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as be:
            print(f"广播全局事件失败: {be}")

        # 准备响应数据
        response_data = {
            "message": "全局事件处理成功",
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
        
        return response_data
    except Exception as e:
        print(f"处理全局事件时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理全局事件失败: {str(e)}")


@router.post("/api/vote/event")
async def handle_vote_event(vote_data: VoteEvent):
    """
    处理全局投票事件
    
    参数:
        vote_data (VoteEvent): 投票事件数据
    
    返回:
        dict: 包含处理结果的响应信息
    """
    try:
        print(f"投票事件 - 剩余时间: {vote_data.time} 秒")
        total_tickets = 0
        winning_game = None
        max_tickets = 0
        
        for vote in vote_data.votes:
            print(f"  游戏: {vote.game}, 票数: {vote.ticket}")
            total_tickets += vote.ticket
            if vote.ticket > max_tickets:
                max_tickets = vote.ticket
                winning_game = vote.game
        
        # 如果投票时间结束且有获胜游戏，将其添加到锦标赛顺序中
        if vote_data.time <= 0 and winning_game:
            tournament_manager.add_selected_game(winning_game)
            print(f"投票结束，获胜游戏: {winning_game}")
        
        # 更新数据管理器中的投票数据
        data_manager.update_vote_data(vote_data)
        
        # 准备响应数据
        response_data = {
            "message": "投票事件处理成功",
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
        
        return response_data
    except Exception as e:
        print(f"处理投票事件时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理投票事件失败: {str(e)}")


@router.post("/api/tournament/reset")
async def reset_tournament():
    """
    重置锦标赛状态
    
    返回:
        dict: 包含重置结果的响应信息
    """
    try:
        tournament_manager.reset_tournament()
        
        response_data = {
            "message": "锦标赛状态重置成功",
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
        
        # 通过WebSocket广播重置事件
        websocket_message = {
            "type": "tournament_reset",
            "data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        await connection_manager.broadcast(websocket_message)
        
        return response_data
    except Exception as e:
        print(f"重置锦标赛状态时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"重置锦标赛状态失败: {str(e)}")


@router.get("/api/tournament/status")
async def get_tournament_status():
    """
    获取锦标赛当前状态
    
    返回:
        dict: 包含锦标赛状态信息的响应
    """
    try:
        status = tournament_manager.get_tournament_status()
        
        response_data = {
            "message": "获取锦标赛状态成功",
            "success": True,
            "tournament_status": status,
            "timestamp": datetime.now().isoformat()
        }
        
        return response_data
    except Exception as e:
        print(f"获取锦标赛状态时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取锦标赛状态失败: {str(e)}")