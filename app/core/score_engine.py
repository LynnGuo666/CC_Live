"""
分数预测引擎
根据游戏事件实时计算和预测本局分数榜
"""

from typing import Dict, List, Optional, Any
from collections import defaultdict
from datetime import datetime
import copy

from app.core.game_config import game_config


class ScorePredictionEngine:
    def __init__(self):
        # 当前游戏状态
        self.current_game_id: Optional[str] = None
        self.current_round: int = 1
        
        # 游戏内部状态追踪
        self.game_state: Dict[str, Any] = {}
        self.players_alive: Dict[str, bool] = {}  # 玩家存活状态
        self.team_players: Dict[str, List[str]] = defaultdict(list)  # 队伍玩家映射
        
        # 分数追踪
        self.predicted_scores: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))  # {team: {player: score}}
        self.event_history: List[Dict[str, Any]] = []
        
        # 特殊游戏状态
        self.parkour_chase_state = {
            'chaser_counts': defaultdict(int),  # 追击者次数统计
            'round_start_time': None,
            'current_chasers': set(),
            'eliminated_players': set()
        }
        
        self.tntrun_state = {
            'elimination_order': [],  # 淘汰顺序
            'players_in_round': set()
        }
        
        self.skywars_state = {
            'eliminated_players': set(),
            'team_elimination_count': defaultdict(int)
        }
        
        self.hot_cod_state = {
            'arena_players': defaultdict(set),  # 每个场地的玩家
            'elimination_order': defaultdict(list),  # 每个场地的淘汰顺序
            'first_holders': set()  # 第一位持有者
        }
        
        self.runaway_warrior_state = {
            'checkpoint_progress': defaultdict(list),  # 玩家检查点进度
            'completion_routes': {}  # 完成路线类型
        }
    
    def set_current_game(self, game_id: str, round_num: int = 1):
        """设置当前游戏"""
        self.current_game_id = game_id
        self.current_round = round_num
        self.reset_game_state()
        
        # 初始化队伍玩家映射
        teams = game_config.get_teams()
        for team in teams:
            team_id = team['id']
            self.team_players[team_id] = []  # 实际玩家会通过事件添加
    
    def reset_game_state(self):
        """重置游戏状态"""
        self.game_state = {}
        self.players_alive = {}
        self.predicted_scores = defaultdict(lambda: defaultdict(int))
        self.event_history = []
        
        # 重置特殊游戏状态
        self.parkour_chase_state = {
            'chaser_counts': defaultdict(int),
            'round_start_time': None,
            'current_chasers': set(),
            'eliminated_players': set()
        }
        self.tntrun_state = {
            'elimination_order': [],
            'players_in_round': set()
        }
        self.skywars_state = {
            'eliminated_players': set(),
            'team_elimination_count': defaultdict(int)
        }
        self.hot_cod_state = {
            'arena_players': defaultdict(set),
            'elimination_order': defaultdict(list),
            'first_holders': set()
        }
        self.runaway_warrior_state = {
            'checkpoint_progress': defaultdict(list),
            'completion_routes': {}
        }
    
    def add_player_to_team(self, player: str, team: str):
        """添加玩家到队伍"""
        if player not in self.team_players[team]:
            self.team_players[team].append(player)
        self.players_alive[player] = True
    
    def process_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理游戏事件并更新分数预测"""
        if not self.current_game_id:
            return {"error": "没有设置当前游戏"}
        
        # 记录事件
        event_record = {
            'timestamp': datetime.now().isoformat(),
            'game_id': self.current_game_id,
            'event': event_data
        }
        self.event_history.append(event_record)
        
        # 添加玩家到队伍映射
        if event_data.get('player') and event_data.get('team'):
            self.add_player_to_team(event_data['player'], event_data['team'])
        
        # 根据游戏类型处理事件
        if self.current_game_id == 'bingo':
            return self._process_bingo_event(event_data)
        elif self.current_game_id == 'parkour_chase':
            return self._process_parkour_chase_event(event_data)
        elif self.current_game_id == 'battle_box':
            return self._process_battle_box_event(event_data)
        elif self.current_game_id == 'tntrun':
            return self._process_tntrun_event(event_data)
        elif self.current_game_id == 'skywars':
            return self._process_skywars_event(event_data)
        elif self.current_game_id == 'hot_cod':
            return self._process_hot_cod_event(event_data)
        elif self.current_game_id == 'runaway_warrior':
            return self._process_runaway_warrior_event(event_data)
        else:
            return {"error": f"未知游戏类型: {self.current_game_id}"}
    
    def _process_bingo_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理宾果时速事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        lore = event_data.get('lore', '')
        
        if event_type == 'Item_Found':
            scoring_rules = game_config.get_scoring_rules('bingo')
            
            # 记录队伍获取物品的顺序
            item_id = lore
            if 'item_teams' not in self.game_state:
                self.game_state['item_teams'] = {}
            if item_id not in self.game_state['item_teams']:
                self.game_state['item_teams'][item_id] = []
            
            if team not in self.game_state['item_teams'][item_id]:
                self.game_state['item_teams'][item_id].append(team)
                
                # 计算队伍排名积分
                rank = len(self.game_state['item_teams'][item_id])
                team_score = scoring_rules.get('team_placement', {}).get(rank, 5)
                
                # 给队伍所有玩家加分
                for team_player in self.team_players[team]:
                    self.predicted_scores[team][team_player] += team_score
                
                # 给找到物品的玩家额外积分
                player_bonus = scoring_rules.get('player_bonus', 20)
                self.predicted_scores[team][player] += player_bonus
        
        return self._generate_prediction_result()
    
    def _process_parkour_chase_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理跑酷追击事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        lore = event_data.get('lore', '')
        
        scoring_rules = game_config.get_scoring_rules('parkour_chase')
        
        if event_type == 'Chaser_Selected':
            self.parkour_chase_state['current_chasers'].add(player)
            self.parkour_chase_state['chaser_counts'][player] += 1
            
        elif event_type == 'Round_Start':
            self.parkour_chase_state['round_start_time'] = datetime.now()
            self.parkour_chase_state['eliminated_players'] = set()
            
        elif event_type == 'Player_Tagged':
            tagged_player = lore
            self.parkour_chase_state['eliminated_players'].add(tagged_player)
            
            # 追击者获得击杀积分
            kill_bonus = scoring_rules.get('chaser', {}).get('kill_bonus', 6)
            self.predicted_scores[team][player] += kill_bonus
            
        elif event_type == 'Round_Over':
            # 计算存活奖励和时间奖励
            if self.parkour_chase_state['round_start_time']:
                duration = (datetime.now() - self.parkour_chase_state['round_start_time']).total_seconds()
                time_intervals = int(duration // scoring_rules.get('escaper', {}).get('time_interval', 10))
                time_bonus = scoring_rules.get('escaper', {}).get('time_bonus', 2) * time_intervals
                
                # 给存活的逃生者积分
                survival_bonus = scoring_rules.get('escaper', {}).get('survival_bonus', 20)
                for team_id, players in self.team_players.items():
                    for p in players:
                        if p not in self.parkour_chase_state['eliminated_players'] and p not in self.parkour_chase_state['current_chasers']:
                            self.predicted_scores[team_id][p] += survival_bonus + time_bonus
                
                # 如果追击者成功抓住所有人
                total_escapers = sum(len(players) for players in self.team_players.values()) - len(self.parkour_chase_state['current_chasers'])
                if len(self.parkour_chase_state['eliminated_players']) >= total_escapers:
                    complete_bonus = scoring_rules.get('chaser', {}).get('complete_elimination', 30)
                    for chaser in self.parkour_chase_state['current_chasers']:
                        chaser_team = None
                        for team_id, players in self.team_players.items():
                            if chaser in players:
                                chaser_team = team_id
                                break
                        if chaser_team:
                            self.predicted_scores[chaser_team][chaser] += complete_bonus
            
            # 重置回合状态
            self.parkour_chase_state['current_chasers'] = set()
        
        return self._generate_prediction_result()
    
    def _process_battle_box_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理斗战方框事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        lore = event_data.get('lore', '')
        
        scoring_rules = game_config.get_scoring_rules('battle_box')
        
        if event_type == 'Kill':
            kill_score = scoring_rules.get('kill', 15)
            self.predicted_scores[team][player] += kill_score
            
        elif event_type == 'Wool_Win':
            win_score = scoring_rules.get('win', 40)
            # 给获胜队伍所有玩家加分
            for team_player in self.team_players[team]:
                self.predicted_scores[team][team_player] += win_score
        
        return self._generate_prediction_result()
    
    def _process_tntrun_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理TNT飞跃事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        
        scoring_rules = game_config.get_scoring_rules('tntrun')
        
        if event_type == 'Round_Start':
            self.tntrun_state['elimination_order'] = []
            self.tntrun_state['players_in_round'] = set()
            for players in self.team_players.values():
                self.tntrun_state['players_in_round'].update(players)
                
        elif event_type == 'Player_Fall':
            if player not in self.tntrun_state['elimination_order']:
                self.tntrun_state['elimination_order'].append(player)
                
                # 计算存活积分：每有一名玩家在你之前坠落得分
                remaining_players = len(self.tntrun_state['players_in_round']) - len(self.tntrun_state['elimination_order'])
                survival_score = scoring_rules.get('survival', 4) * remaining_players
                
                # 给还活着的玩家积分
                for team_id, players in self.team_players.items():
                    for p in players:
                        if p not in self.tntrun_state['elimination_order']:
                            self.predicted_scores[team_id][p] += scoring_rules.get('survival', 4)
                            
        elif event_type == 'Round_Over':
            # 计算排名奖励
            placement_bonus = scoring_rules.get('placement_bonus', {})
            
            # 最后存活的玩家排名
            survived_players = []
            for team_id, players in self.team_players.items():
                for p in players:
                    if p not in self.tntrun_state['elimination_order']:
                        survived_players.append((p, team_id))
            
            # 给前三名额外积分
            for i, (p, team_id) in enumerate(survived_players[:3]):
                bonus = placement_bonus.get(i + 1, 0)
                self.predicted_scores[team_id][p] += bonus
        
        return self._generate_prediction_result()
    
    def _process_skywars_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理空岛乱斗事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        lore = event_data.get('lore', '')
        
        scoring_rules = game_config.get_scoring_rules('skywars')
        
        if event_type == 'Kill':
            kill_score = scoring_rules.get('kill', 40)
            self.predicted_scores[team][player] += kill_score
            
            # 记录被击杀玩家
            killed_player = lore
            self.skywars_state['eliminated_players'].add(killed_player)
            
        elif event_type == 'Fall':
            self.skywars_state['eliminated_players'].add(player)
            
            # 给存活玩家积分
            survival_score = scoring_rules.get('survival', 10)
            for team_id, players in self.team_players.items():
                for p in players:
                    if p not in self.skywars_state['eliminated_players']:
                        self.predicted_scores[team_id][p] += survival_score
        
        elif event_type == 'Round_Over':
            # 最后存活玩家奖励
            last_standing_score = scoring_rules.get('last_standing', 50)
            for team_id, players in self.team_players.items():
                for p in players:
                    if p not in self.skywars_state['eliminated_players']:
                        self.predicted_scores[team_id][p] += last_standing_score
        
        return self._generate_prediction_result()
    
    def _process_hot_cod_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理烫手鳕鱼事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        lore = event_data.get('lore', '')
        
        scoring_rules = game_config.get_scoring_rules('hot_cod')
        
        if event_type == 'Cod_Passed':
            # 记录第一位持有者
            if len(self.hot_cod_state['first_holders']) == 0:
                self.hot_cod_state['first_holders'].add(player)
                first_holder_bonus = scoring_rules.get('first_holder_bonus', 10)
                self.predicted_scores[team][player] += first_holder_bonus
                
        elif event_type == 'Death':
            # 假设arena_id从某处获得，这里简化处理
            arena_id = 1  # 实际应该从游戏状态获取
            self.hot_cod_state['elimination_order'][arena_id].append(player)
            
            # 给同场地存活玩家积分
            survival_score = scoring_rules.get('survival', 15)
            for team_id, players in self.team_players.items():
                for p in players:
                    if p != player:  # 不给自己加分
                        self.predicted_scores[team_id][p] += survival_score
        
        return self._generate_prediction_result()
    
    def _process_runaway_warrior_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理跑路战士事件"""
        event_type = event_data.get('event')
        player = event_data.get('player')
        team = event_data.get('team')
        lore = event_data.get('lore', '')
        
        scoring_rules = game_config.get_scoring_rules('runaway_warrior')
        
        if event_type == 'Checkpoint':
            checkpoint_id = lore
            self.runaway_warrior_state['checkpoint_progress'][player].append(checkpoint_id)
            
            # 根据检查点类型给分
            if checkpoint_id.startswith('main'):
                # 主线检查点，按星级计分
                if '2star' in checkpoint_id:
                    score = scoring_rules.get('checkpoints', {}).get('two_star', 2)
                elif '3star' in checkpoint_id:
                    count = len([cp for cp in self.runaway_warrior_state['checkpoint_progress'][player] if '3star' in cp])
                    three_star_scores = scoring_rules.get('checkpoints', {}).get('three_star', [5, 10, 10, 15, 20])
                    score = three_star_scores[min(count - 1, len(three_star_scores) - 1)]
                elif '4star' in checkpoint_id:
                    count = len([cp for cp in self.runaway_warrior_state['checkpoint_progress'][player] if '4star' in cp])
                    four_star_scores = scoring_rules.get('checkpoints', {}).get('four_star', [10, 15, 20, 25, 30])
                    score = four_star_scores[min(count - 1, len(four_star_scores) - 1)]
                elif '5star' in checkpoint_id:
                    count = len([cp for cp in self.runaway_warrior_state['checkpoint_progress'][player] if '5star' in cp])
                    five_star_scores = scoring_rules.get('checkpoints', {}).get('five_star', [15, 20, 25, 30, 50])
                    score = five_star_scores[min(count - 1, len(five_star_scores) - 1)]
                else:
                    score = 0
                
                self.predicted_scores[team][player] += score
                
        elif event_type == 'Player_Finish':
            route_type = lore  # simple/normal/hard
            self.runaway_warrior_state['completion_routes'][player] = route_type
            
            # 完成路线的基础积分会在最终结算时计算
        
        return self._generate_prediction_result()
    
    def _generate_prediction_result(self) -> Dict[str, Any]:
        """生成预测结果"""
        # 计算队伍总分
        team_scores = {}
        team_rankings = []
        
        for team_id in self.team_players.keys():
            team_total = sum(self.predicted_scores[team_id].values())
            team_scores[team_id] = {
                'team_id': team_id,
                'total_score': team_total,
                'players': dict(self.predicted_scores[team_id])
            }
        
        # 按总分排序
        team_rankings = sorted(team_scores.values(), key=lambda x: x['total_score'], reverse=True)
        
        # 添加排名
        for i, team_data in enumerate(team_rankings):
            team_data['rank'] = i + 1
        
        return {
            'game_id': self.current_game_id,
            'round': self.current_round,
            'timestamp': datetime.now().isoformat(),
            'team_rankings': team_rankings,
            'total_events_processed': len(self.event_history)
        }
    
    def get_current_standings(self) -> Dict[str, Any]:
        """获取当前分数榜"""
        return self._generate_prediction_result()


# 全局分数预测引擎实例
score_engine = ScorePredictionEngine()