from typing import Dict, List, Optional, Tuple
from app.core.config import config
import time

class ScorePredictionEngine:
    def __init__(self):
        self.game_states = {}  # 存储每个游戏的状态
        self.predicted_scores = {}  # 存储预测分数
        self.actual_scores = {}  # 存储实际分数
        
    def initialize_game(self, game_id: str, teams: List[str], players: Dict[str, List[str]]):
        """初始化游戏状态"""
        self.game_states[game_id] = {
            "teams": teams,
            "players": players,
            "events": [],
            "start_time": time.time(),
            "current_round": 1,
            "survival_order": [],  # 淘汰顺序
            "team_items_found": {},  # 宾果时速：队伍找到的物品
            "chaser_counts": {},  # 跑酷追击：追击者次数统计
            "elimination_times": {},  # 玩家淘汰时间
        }
        
        # 初始化预测分数
        self.predicted_scores[game_id] = {}
        for team in teams:
            self.predicted_scores[game_id][team] = 0
            for player in players.get(team, []):
                self.predicted_scores[game_id][player] = 0
    
    def process_event(self, game_id: str, event_data: Dict) -> Dict:
        """处理游戏事件并预测分数变化"""
        if game_id not in self.game_states:
            return {"error": "Game not initialized"}
        
        game_state = self.game_states[game_id]
        event_type = event_data.get("event")
        player = event_data.get("player")
        team = event_data.get("team")
        lore = event_data.get("lore", "")
        
        # 记录事件
        game_state["events"].append({
            "event": event_type,
            "player": player,
            "team": team,
            "lore": lore,
            "timestamp": time.time()
        })
        
        # 根据游戏类型和事件类型预测分数
        score_changes = self._calculate_score_prediction(game_id, event_data)
        
        # 更新预测分数
        if score_changes:
            for entity, change in score_changes.items():
                if entity in self.predicted_scores[game_id]:
                    self.predicted_scores[game_id][entity] += change
        
        return {
            "score_predictions": score_changes,
            "total_predicted_scores": self.predicted_scores.get(game_id, {}),
            "event_processed": True
        }
    
    def _calculate_score_prediction(self, game_id: str, event_data: Dict) -> Dict:
        """根据事件计算分数预测"""
        game_type = game_id.split("_")[0] if "_" in game_id else game_id
        event_type = event_data.get("event")
        player = event_data.get("player")
        team = event_data.get("team")
        lore = event_data.get("lore", "")
        
        scoring_rules = config.get_scoring_rules().get(game_type, {})
        score_changes = {}
        
        if game_type == "bingo_speed":
            if event_type == "Item_Found":
                # 计算队伍排名积分
                item_id = lore
                if item_id not in self.game_states[game_id]["team_items_found"]:
                    self.game_states[game_id]["team_items_found"][item_id] = []
                
                teams_found = self.game_states[game_id]["team_items_found"][item_id]
                if team not in teams_found:
                    teams_found.append(team)
                    rank = len(teams_found)
                    
                    # 队伍积分
                    team_points = scoring_rules.get("team_placement", {}).get(rank, 5)
                    score_changes[team] = team_points
                    
                    # 玩家额外积分
                    player_bonus = scoring_rules.get("player_bonus", 20)
                    score_changes[player] = player_bonus
                    
        elif game_type == "parkour_chase":
            if event_type == "Player_Tagged":
                # 追击者击杀积分
                score_changes[player] = scoring_rules.get("chaser", {}).get("kill_bonus", 6)
                
            elif event_type == "Round_Over":
                # 计算存活积分和时间积分
                current_time = time.time()
                start_time = self.game_states[game_id]["start_time"]
                survival_time = current_time - start_time
                
                # 存活时间积分（每10秒2分）
                time_bonus = int(survival_time / 10) * scoring_rules.get("escaper", {}).get("time_bonus", 2)
                if player:
                    score_changes[player] = time_bonus
                    
        elif game_type == "battle_box":
            if event_type == "Kill":
                # 击杀积分
                score_changes[player] = scoring_rules.get("kill", 15)
                
            elif event_type == "Wool_Win":
                # 胜利积分（整队）
                win_points = scoring_rules.get("win", 40)
                game_state = self.game_states[game_id]
                team_players = game_state["players"].get(team, [])
                for team_player in team_players:
                    score_changes[team_player] = win_points
                    
        elif game_type == "tnt_spleef":
            if event_type == "Player_Fall":
                # 记录淘汰顺序
                if player not in self.game_states[game_id]["survival_order"]:
                    self.game_states[game_id]["survival_order"].append(player)
                
                # 为其他存活玩家计算积分
                survival_points = scoring_rules.get("survival", 4)
                game_state = self.game_states[game_id]
                for team_players in game_state["players"].values():
                    for p in team_players:
                        if p not in self.game_states[game_id]["survival_order"]:
                            score_changes[p] = score_changes.get(p, 0) + survival_points
                            
        elif game_type == "sky_brawl":
            if event_type == "Kill":
                # 击杀积分
                score_changes[player] = scoring_rules.get("kill", 40)
                
            elif event_type == "Fall":
                # 生存积分
                if player not in self.game_states[game_id]["survival_order"]:
                    self.game_states[game_id]["survival_order"].append(player)
                
                survival_points = scoring_rules.get("survival", 10)
                game_state = self.game_states[game_id]
                for team_players in game_state["players"].values():
                    for p in team_players:
                        if p not in self.game_states[game_id]["survival_order"]:
                            score_changes[p] = score_changes.get(p, 0) + survival_points
                            
        elif game_type == "hot_cod":
            if event_type == "Death":
                # 记录死亡顺序
                if player not in self.game_states[game_id]["survival_order"]:
                    self.game_states[game_id]["survival_order"].append(player)
                
                # 存活积分
                survival_points = scoring_rules.get("survival", 15)
                game_state = self.game_states[game_id]
                # 计算同场地的存活玩家
                for p in game_state["players"].get(team, []):
                    if p != player and p not in self.game_states[game_id]["survival_order"]:
                        score_changes[p] = score_changes.get(p, 0) + survival_points
                        
        elif game_type == "runaway_warrior":
            if event_type == "Checkpoint":
                checkpoint_type = self._determine_checkpoint_type(lore)
                checkpoint_rules = scoring_rules.get("checkpoints", {})
                
                if checkpoint_type == "two_star":
                    score_changes[player] = checkpoint_rules.get("two_star", 2)
                elif checkpoint_type in ["three_star", "four_star", "five_star"]:
                    # 需要追踪玩家完成的该类型关卡数量
                    completed_count = self._get_player_checkpoint_count(game_id, player, checkpoint_type)
                    points_list = checkpoint_rules.get(checkpoint_type, [])
                    if completed_count < len(points_list):
                        score_changes[player] = points_list[completed_count]
                        
        elif game_type == "dodging_bolt":
            if event_type == "Player_Eliminated":
                # 淘汰积分
                score_changes[player] = scoring_rules.get("elimination", 50)
                
        return score_changes
    
    def _determine_checkpoint_type(self, checkpoint_id: str) -> str:
        """根据检查点ID确定检查点类型"""
        if checkpoint_id.startswith("main"):
            return "two_star"
        elif checkpoint_id.startswith("sub1"):
            return "three_star"
        elif checkpoint_id.startswith("sub2"):
            return "four_star"
        elif checkpoint_id.startswith("sub3"):
            return "five_star"
        return "two_star"
    
    def _get_player_checkpoint_count(self, game_id: str, player: str, checkpoint_type: str) -> int:
        """获取玩家完成的指定类型检查点数量"""
        count = 0
        events = self.game_states[game_id]["events"]
        for event in events:
            if (event["event"] == "Checkpoint" and 
                event["player"] == player and 
                self._determine_checkpoint_type(event["lore"]) == checkpoint_type):
                count += 1
        return count
    
    def update_actual_scores(self, game_id: str, scores: Dict):
        """更新实际分数，以POST数据为准"""
        self.actual_scores[game_id] = scores
    
    def get_score_comparison(self, game_id: str) -> Dict:
        """获取预测分数和实际分数的对比"""
        return {
            "predicted": self.predicted_scores.get(game_id, {}),
            "actual": self.actual_scores.get(game_id, {}),
            "differences": self._calculate_differences(game_id)
        }
    
    def _calculate_differences(self, game_id: str) -> Dict:
        """计算预测和实际分数的差异"""
        predicted = self.predicted_scores.get(game_id, {})
        actual = self.actual_scores.get(game_id, {})
        differences = {}
        
        all_entities = set(predicted.keys()) | set(actual.keys())
        for entity in all_entities:
            pred_score = predicted.get(entity, 0)
            actual_score = actual.get(entity, 0)
            differences[entity] = actual_score - pred_score
            
        return differences

# 全局实例
score_predictor = ScorePredictionEngine()