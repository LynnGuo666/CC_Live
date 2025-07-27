import yaml
import os
from typing import Dict, List, Any

class TournamentConfig:
    """
    锦标赛配置管理类
    负责加载和管理YAML配置文件中的锦标赛规则、积分权重等信息
    """
    def __init__(self, config_path: str = "tournament_config.yml"):
        self.config_path = config_path
        self._config = None
        self.load_config()
    
    def load_config(self):
        """加载YAML配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                self._config = yaml.safe_load(file)
        except FileNotFoundError:
            print(f"Configuration file {self.config_path} not found!")
            self._config = {}
    
    def get_tournament_info(self) -> Dict:
        """获取锦标赛基本信息"""
        return self._config.get('tournament', {})
    
    def get_teams(self) -> List[Dict]:
        """获取所有队伍信息"""
        return self._config.get('teams', [])
    
    def get_games(self) -> List[Dict]:
        """获取所有游戏信息"""
        return self._config.get('games', [])
    
    def get_game_by_id(self, game_id: str) -> Dict:
        """根据游戏ID获取游戏信息"""
        games = self.get_games()
        for game in games:
            if game.get('id') == game_id:
                return game
        return {}
    
    def get_schedule(self) -> Dict:
        """获取比赛日程安排"""
        return self._config.get('schedule', {})
    
    def get_scoring_rules(self) -> Dict:
        """获取积分规则"""
        return self._config.get('scoring', {})
    
    def get_round_multipliers(self) -> Dict[int, float]:
        """获取轮次积分权重"""
        return self._config.get('round_multipliers', {
            1: 1.0, 2: 1.5, 3: 1.5, 4: 2.0, 5: 2.0, 6: 2.5
        })
    
    def get_round_multiplier(self, round_number: int) -> float:
        """获取指定轮次的积分权重"""
        multipliers = self.get_round_multipliers()
        return multipliers.get(round_number, 1.0)
    
    def calculate_weighted_score(self, base_score: int, round_number: int) -> float:
        """计算带权重的积分
        
        Args:
            base_score: 游戏内原始积分
            round_number: 轮次编号
            
        Returns:
            加权后的最终积分
        """
        multiplier = self.get_round_multiplier(round_number)
        return base_score * multiplier
    
    def get_event_types(self, game_id: str) -> List[Dict]:
        """获取指定游戏的事件类型定义"""
        event_types = self._config.get('event_types', {})
        return event_types.get(game_id, [])
    
    def get_estimated_time(self, game_id: str) -> int:
        """获取游戏预估时长"""
        game = self.get_game_by_id(game_id)
        return game.get('estimated_time', 15)
    
    def get_total_estimated_time(self) -> int:
        """获取锦标赛总预估时长"""
        return self.get_tournament_info().get('estimated_duration', 180)

# 全局配置实例
config = TournamentConfig()