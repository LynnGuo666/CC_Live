"""
游戏路由模块
处理特定游戏的事件和分数更新API端点
"""

from fastapi import APIRouter, HTTPException
from typing import List
from models import GameEvent, ScoreUpdate

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
        
        return {
            "message": "游戏事件处理成功",
            "success": True,
            "game_id": game_id,
            "event": {
                "player": event.player,
                "team": event.team,
                "event": event.event,
                "lore": event.lore
            }
        }
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
        
        return {
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
    except Exception as e:
        print(f"处理游戏分数更新时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理游戏分数更新失败: {str(e)}")