from typing import Dict, List, Optional, Tuple
from app.core.config import config
import time

class ScorePredictionEngine:
    """
    分数预测引擎
    根据游戏事件实时预测积分变化，支持多种游戏类型的积分规则
    提供预测分数与实际分数的对比功能，确保积分准确性
    支持万能替补系统和轮次积分权重
    """
    def __init__(self):
        """
        初始化分数预测引擎
        """
        self.game_states = {}  # 存储每个游戏的状态和事件历史
        self.predicted_scores = {}  # 存储基于事件的预测分数
        self.actual_scores = {}  # 存储来自POST的实际分数（权威数据）
        
    def initialize_game(self, game_id: str, teams: List[str], players: Dict[str, List[str]]):
        """
        初始化游戏状态和预测数据结构
        支持万能替补：同一玩家可能在不同游戏中属于不同队伍
        
        Args:
            game_id: 游戏唯一标识符
            teams: 参与的队伍列表
            players: 队伍和玩家的映射关系 {"team_id": ["player1", "player2"]}
        """
        self.game_states[game_id] = {
            "teams": teams,  # 参与的队伍列表
            "players": players,  # 队伍-玩家映射（支持万能替补）
            "events": [],  # 游戏事件历史记录
            "start_time": time.time(),  # 游戏开始时间
            "current_round": 1,  # 当前轮次
            "survival_order": [],  # 玩家淘汰顺序（用于生存类游戏）
            "team_items_found": {},  # 宾果时速：队伍找到的物品记录
            "chaser_counts": {},  # 跑酷追击：追击者次数统计
            "elimination_times": {},  # 玩家淘汰时间记录
        }
        
        # 初始化预测分数存储
        self.predicted_scores[game_id] = {}
        # 为每个队伍和玩家初始化预测分数为0
        for team in teams:
            self.predicted_scores[game_id][team] = 0
            for player in players.get(team, []):
                self.predicted_scores[game_id][player] = 0
    
    def process_event(self, game_id: str, event_data: Dict) -> Dict:
        """
        处理游戏事件并实时预测分数变化
        基于游戏规则和事件类型计算积分，用于实时展示和预测对比
        
        Args:
            game_id: 游戏标识符
            event_data: 事件数据 {"event": 事件类型, "player": 玩家, "team": 队伍, "lore": 附加信息}
            
        Returns:
            包含分数预测变化和总预测分数的字典
        """
        if game_id not in self.game_states:
            return {"error": "Game not initialized"}
        
        game_state = self.game_states[game_id]
        event_type = event_data.get("event")
        player = event_data.get("player")
        team = event_data.get("team")
        lore = event_data.get("lore", "")
        
        # 记录事件到游戏历史
        game_state["events"].append({
            "event": event_type,
            "player": player,
            "team": team,
            "lore": lore,
            "timestamp": time.time()
        })
        
        # 根据游戏类型和事件类型计算预测分数变化
        score_changes = self._calculate_score_prediction(game_id, event_data)
        
        # 更新累计预测分数
        if score_changes:
            for entity, change in score_changes.items():
                if entity in self.predicted_scores[game_id]:
                    self.predicted_scores[game_id][entity] += change
        
        return {
            "score_predictions": score_changes,  # 本次事件的分数变化
            "total_predicted_scores": self.predicted_scores.get(game_id, {}),  # 累计预测分数
            "event_processed": True
        }
    
    def _calculate_score_prediction(self, game_id: str, event_data: Dict) -> Dict:
        """
        根据事件类型和游戏规则计算分数预测
        支持所有7种游戏类型的积分规则
        
        Args:
            game_id: 游戏标识符
            event_data: 事件数据
            
        Returns:
            分数变化字典 {"entity": score_change}
        """
        # 从game_id提取游戏类型（例如："bingo_speed_round1" -> "bingo_speed"）
        game_type = game_id.split("_")[0] if "_" in game_id else game_id
        event_type = event_data.get("event")
        player = event_data.get("player")
        team = event_data.get("team")
        lore = event_data.get("lore", "")
        
        # 获取游戏的积分规则配置
        scoring_rules = config.get_scoring_rules().get(game_type, {})
        score_changes = {}
        
        # 宾果时速：物品收集竞速游戏
        if game_type == "bingo_speed":
            if event_type == "Item_Found":
                # 计算队伍排名积分（第一个找到物品的队伍获得最高分）
                item_id = lore
                if item_id not in self.game_states[game_id]["team_items_found"]:
                    self.game_states[game_id]["team_items_found"][item_id] = []
                
                teams_found = self.game_states[game_id]["team_items_found"][item_id]
                if team not in teams_found:
                    teams_found.append(team)
                    rank = len(teams_found)  # 队伍排名（1=第一名）
                    
                    # 队伍排名积分
                    team_points = scoring_rules.get("team_placement", {}).get(rank, 5)
                    score_changes[team] = team_points
                    
                    # 找到物品的玩家额外积分
                    player_bonus = scoring_rules.get("player_bonus", 20)
                    score_changes[player] = player_bonus
                    
        # 跑酷追击：追击与逃脱游戏
        elif game_type == "parkour_chase":
            if event_type == "Player_Tagged":
                # 追击者成功标记逃脱者的积分
                score_changes[player] = scoring_rules.get("chaser", {}).get("kill_bonus", 6)
                
            elif event_type == "Round_Over":
                # 计算逃脱者的存活积分和时间积分
                current_time = time.time()
                start_time = self.game_states[game_id]["start_time"]
                survival_time = current_time - start_time
                
                # 存活时间积分（每10秒2分）
                time_bonus = int(survival_time / 10) * scoring_rules.get("escaper", {}).get("time_bonus", 2)
                if player:
                    score_changes[player] = time_bonus
                    
        # 斗战方框：团队战斗游戏
        elif game_type == "battle_box":
            if event_type == "Kill":
                # 击杀敌方玩家的积分
                score_changes[player] = scoring_rules.get("kill", 15)
                
            elif event_type == "Wool_Win":
                # 羊毛胜利积分（整个队伍获得）
                win_points = scoring_rules.get("win", 40)
                game_state = self.game_states[game_id]
                team_players = game_state["players"].get(team, [])
                for team_player in team_players:
                    score_changes[team_player] = win_points
                    
        # TNT飞跃：方块消失生存游戏
        elif game_type == "tnt_spleef":
            if event_type == "Player_Fall":
                # 记录玩家淘汰顺序
                if player not in self.game_states[game_id]["survival_order"]:
                    self.game_states[game_id]["survival_order"].append(player)
                
                # 为其他仍存活的玩家计算生存积分
                survival_points = scoring_rules.get("survival", 4)
                game_state = self.game_states[game_id]
                for team_players in game_state["players"].values():
                    for p in team_players:
                        if p not in self.game_states[game_id]["survival_order"]:
                            score_changes[p] = score_changes.get(p, 0) + survival_points
                            
        # 空岛乱斗：资源收集与战斗游戏
        elif game_type == "sky_brawl":
            if event_type == "Kill":
                # 击杀敌方玩家积分
                score_changes[player] = scoring_rules.get("kill", 40)
                
            elif event_type == "Fall":
                # 玩家掉入虚空，为其他存活玩家计算生存积分
                if player not in self.game_states[game_id]["survival_order"]:
                    self.game_states[game_id]["survival_order"].append(player)
                
                survival_points = scoring_rules.get("survival", 10)
                game_state = self.game_states[game_id]
                for team_players in game_state["players"].values():
                    for p in team_players:
                        if p not in self.game_states[game_id]["survival_order"]:
                            score_changes[p] = score_changes.get(p, 0) + survival_points
                            
        # 烫手鳕鱼：传递与爆炸生存游戏
        elif game_type == "hot_cod":
            if event_type == "Death":
                # 记录鳕鱼爆炸死亡顺序
                if player not in self.game_states[game_id]["survival_order"]:
                    self.game_states[game_id]["survival_order"].append(player)
                
                # 为同场地的其他存活玩家计算生存积分
                survival_points = scoring_rules.get("survival", 15)
                game_state = self.game_states[game_id]
                # 计算同场地（同队伍）的存活玩家
                for p in game_state["players"].get(team, []):
                    if p != player and p not in self.game_states[game_id]["survival_order"]:
                        score_changes[p] = score_changes.get(p, 0) + survival_points
                        
        # 跑路战士：跑酷技巧挑战游戏
        elif game_type == "runaway_warrior":
            if event_type == "Checkpoint":
                # 根据检查点类型给予不同积分
                checkpoint_type = self._determine_checkpoint_type(lore)
                checkpoint_rules = scoring_rules.get("checkpoints", {})
                
                if checkpoint_type == "two_star":
                    # 二星关卡固定积分
                    score_changes[player] = checkpoint_rules.get("two_star", 2)
                elif checkpoint_type in ["three_star", "four_star", "five_star"]:
                    # 三星及以上关卡递增积分（需要追踪完成数量）
                    completed_count = self._get_player_checkpoint_count(game_id, player, checkpoint_type)
                    points_list = checkpoint_rules.get(checkpoint_type, [])
                    if completed_count < len(points_list):
                        score_changes[player] = points_list[completed_count]
                        
        # 躲避箭：最终对决游戏
        elif game_type == "dodging_bolt":
            if event_type == "Player_Eliminated":
                # 成功淘汰对手的积分
                score_changes[player] = scoring_rules.get("elimination", 50)
                
        return score_changes
    
    def _determine_checkpoint_type(self, checkpoint_id: str) -> str:
        """
        根据检查点ID确定检查点类型和难度等级
        
        Args:
            checkpoint_id: 检查点标识符
            
        Returns:
            检查点类型 ("two_star", "three_star", "four_star", "five_star")
        """
        if checkpoint_id.startswith("main"):
            return "two_star"  # 主线关卡：二星难度
        elif checkpoint_id.startswith("sub1"):
            return "three_star"  # 支线1：三星难度
        elif checkpoint_id.startswith("sub2"):
            return "four_star"  # 支线2：四星难度
        elif checkpoint_id.startswith("sub3"):
            return "five_star"  # 支线3：五星难度
        return "two_star"  # 默认二星
    
    def _get_player_checkpoint_count(self, game_id: str, player: str, checkpoint_type: str) -> int:
        """
        获取玩家完成的指定类型检查点数量
        用于计算递增积分（三星及以上关卡每个检查点积分不同）
        
        Args:
            game_id: 游戏标识符
            player: 玩家ID
            checkpoint_type: 检查点类型
            
        Returns:
            完成的检查点数量
        """
        count = 0
        events = self.game_states[game_id]["events"]
        for event in events:
            if (event["event"] == "Checkpoint" and 
                event["player"] == player and 
                self._determine_checkpoint_type(event["lore"]) == checkpoint_type):
                count += 1
        return count
    
    def update_actual_scores(self, game_id: str, scores: Dict):
        """
        更新实际分数数据（来自POST接口的权威数据）
        实际分数优先级高于预测分数，用于最终积分结算
        
        Args:
            game_id: 游戏标识符
            scores: 实际分数字典 {"player/team": score}
        """
        self.actual_scores[game_id] = scores
    
    def get_score_comparison(self, game_id: str) -> Dict:
        """
        获取预测分数和实际分数的对比分析
        用于验证预测准确性和调试积分规则
        
        Args:
            game_id: 游戏标识符
            
        Returns:
            包含预测分数、实际分数和差异的对比数据
        """
        return {
            "predicted": self.predicted_scores.get(game_id, {}),  # 基于事件的预测分数
            "actual": self.actual_scores.get(game_id, {}),  # 来自POST的实际分数
            "differences": self._calculate_differences(game_id)  # 预测与实际的差异
        }
    
    def _calculate_differences(self, game_id: str) -> Dict:
        """
        计算预测分数和实际分数的差异
        正值表示实际分数高于预测，负值表示实际分数低于预测
        
        Args:
            game_id: 游戏标识符
            
        Returns:
            差异字典 {"entity": difference}
        """
        predicted = self.predicted_scores.get(game_id, {})
        actual = self.actual_scores.get(game_id, {})
        differences = {}
        
        # 获取所有实体（玩家和队伍）的并集
        all_entities = set(predicted.keys()) | set(actual.keys())
        for entity in all_entities:
            pred_score = predicted.get(entity, 0)
            actual_score = actual.get(entity, 0)
            differences[entity] = actual_score - pred_score  # 实际 - 预测
            
        return differences

# 全局分数预测引擎实例
# 在整个应用中共享使用，确保游戏状态和预测数据的一致性
score_predictor = ScorePredictionEngine()