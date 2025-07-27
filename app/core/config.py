import yaml
import os
from typing import Dict, List, Any

class TournamentConfig:
    def __init__(self, config_path: str = "tournament_config.yml"):
        self.config_path = config_path
        self._config = None
        self.load_config()
    
    def load_config(self):
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                self._config = yaml.safe_load(file)
        except FileNotFoundError:
            print(f"Configuration file {self.config_path} not found!")
            self._config = {}
    
    def get_tournament_info(self) -> Dict:
        return self._config.get('tournament', {})
    
    def get_teams(self) -> List[Dict]:
        return self._config.get('teams', [])
    
    def get_games(self) -> List[Dict]:
        return self._config.get('games', [])
    
    def get_game_by_id(self, game_id: str) -> Dict:
        games = self.get_games()
        for game in games:
            if game.get('id') == game_id:
                return game
        return {}
    
    def get_schedule(self) -> Dict:
        return self._config.get('schedule', {})
    
    def get_scoring_rules(self) -> Dict:
        return self._config.get('scoring', {})
    
    def get_event_types(self, game_id: str) -> List[Dict]:
        event_types = self._config.get('event_types', {})
        return event_types.get(game_id, [])
    
    def get_estimated_time(self, game_id: str) -> int:
        game = self.get_game_by_id(game_id)
        return game.get('estimated_time', 15)
    
    def get_total_estimated_time(self) -> int:
        return self.get_tournament_info().get('estimated_duration', 180)

config = TournamentConfig()