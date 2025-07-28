"""
游戏配置加载模块
加载tournament_config.yml中的游戏规则和积分配置
"""

import yaml
from typing import Dict, Any, List
from pathlib import Path


class GameConfig:
    def __init__(self, config_path: str = "tournament_config.yml"):
        self.config_path = Path(config_path)
        self.config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self):
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
        except Exception as e:
            print(f"加载配置文件失败: {e}")
            self.config = {}
    
    def get_teams(self) -> List[Dict[str, str]]:
        """获取队伍配置"""
        return self.config.get('teams', [])
    
    def get_games(self) -> List[Dict[str, Any]]:
        """获取游戏配置"""
        return self.config.get('games', [])
    
    def get_scoring_rules(self, game_id: str) -> Dict[str, Any]:
        """获取特定游戏的积分规则"""
        return self.config.get('scoring', {}).get(game_id, {})
    
    def get_event_types(self, game_id: str) -> List[Dict[str, Any]]:
        """获取特定游戏的事件类型"""
        return self.config.get('event_types', {}).get(game_id, [])
    
    def get_round_multiplier(self, round_num: int) -> float:
        """获取轮次积分倍数"""
        return self.config.get('round_multipliers', {}).get(round_num, 1.0)
    
    def get_game_info(self, game_id: str) -> Dict[str, Any]:
        """获取游戏详细信息"""
        games = self.get_games()
        for game in games:
            if game.get('id') == game_id:
                return game
        return {}


# 全局配置实例
game_config = GameConfig()