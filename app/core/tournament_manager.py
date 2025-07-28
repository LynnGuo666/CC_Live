"""
锦标赛管理器
负责跟踪锦标赛中的游戏顺序和当前进度
"""

from typing import List, Optional, Dict
from datetime import datetime


class TournamentManager:
    def __init__(self):
        # 存储按投票选中顺序的游戏列表
        self.selected_games: List[str] = []
        # 存储每个游戏的选中时间
        self.game_selection_times: Dict[str, datetime] = {}
        # 当前正在进行的游戏
        self.current_game: Optional[str] = None
    
    def add_selected_game(self, game_name: str) -> int:
        """
        添加一个被选中的游戏到锦标赛顺序中
        
        参数:
            game_name (str): 游戏名称
        
        返回:
            int: 该游戏在锦标赛中的序号（从1开始）
        """
        if game_name not in self.selected_games:
            self.selected_games.append(game_name)
            self.game_selection_times[game_name] = datetime.now()
            print(f"游戏 '{game_name}' 被添加为第 {len(self.selected_games)} 项")
        
        return self.get_game_number(game_name)
    
    def get_game_number(self, game_name: str) -> int:
        """
        获取游戏在锦标赛中的序号
        
        参数:
            game_name (str): 游戏名称
        
        返回:
            int: 游戏序号（从1开始），如果游戏未被选中则返回0
        """
        try:
            return self.selected_games.index(game_name) + 1
        except ValueError:
            return 0
    
    def set_current_game(self, game_name: str):
        """
        设置当前正在进行的游戏
        
        参数:
            game_name (str): 游戏名称
        """
        # 如果这是一个新游戏，将其添加到选中列表
        if game_name not in self.selected_games:
            self.add_selected_game(game_name)
        
        self.current_game = game_name
        print(f"当前游戏设置为: {game_name} (第 {self.get_game_number(game_name)} 项)")
    
    def get_current_game_info(self) -> Optional[Dict]:
        """
        获取当前游戏的信息
        
        返回:
            Optional[Dict]: 包含当前游戏信息的字典，如果没有当前游戏则返回None
        """
        if not self.current_game:
            return None
        
        # 获取游戏在锦标赛中的序号，如果游戏不在选中列表中则返回0
        game_number = self.get_game_number(self.current_game)
        
        return {
            "name": self.current_game,
            "number": game_number,
            "total_selected": len(self.selected_games)
        }
    
    def get_tournament_status(self) -> Dict:
        """
        获取锦标赛的整体状态
        
        返回:
            Dict: 包含锦标赛状态信息的字典
        """
        return {
            "selected_games": self.selected_games.copy(),
            "current_game": self.current_game,
            "total_games_selected": len(self.selected_games),
            "current_game_number": self.get_game_number(self.current_game) if self.current_game else 0
        }
    
    def reset_tournament(self):
        """
        重置锦标赛状态
        """
        self.selected_games.clear()
        self.game_selection_times.clear()
        self.current_game = None
        print("锦标赛状态已重置")


# 全局锦标赛管理器实例
tournament_manager = TournamentManager()