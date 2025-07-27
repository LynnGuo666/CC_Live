"""
全局路由模块
处理全局分数更新、全局事件和投票事件API端点
"""

from fastapi import APIRouter, HTTPException
from typing import List
from models import TeamScore, GlobalEvent, VoteEvent

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
        
        return {
            "message": "全局分数更新处理成功",
            "success": True,
            "total_teams": len(team_scores),
            "team_scores": [
                {
                    "team": team.team,
                    "total_score": team.total_score,
                    "player_count": len(team.scores),
                    "scores": [
                        {
                            "player": score.player,
                            "score": score.score
                        } for score in team.scores
                    ]
                } for team in team_scores
            ]
        }
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
        print(f"全局事件 - 状态: {event.status}, 游戏: {event.game.name}, 回合: {event.game.round}")
        
        return {
            "message": "全局事件处理成功",
            "success": True,
            "event": {
                "status": event.status,
                "game": {
                    "name": event.game.name,
                    "round": event.game.round
                }
            }
        }
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
        for vote in vote_data.votes:
            print(f"  游戏: {vote.game}, 票数: {vote.ticket}")
            total_tickets += vote.ticket
        
        return {
            "message": "投票事件处理成功",
            "success": True,
            "vote_data": {
                "time_remaining": vote_data.time,
                "total_games": len(vote_data.votes),
                "total_tickets": total_tickets,
                "votes": [
                    {
                        "game": vote.game,
                        "ticket": vote.ticket
                    } for vote in vote_data.votes
                ]
            }
        }
    except Exception as e:
        print(f"处理投票事件时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理投票事件失败: {str(e)}")