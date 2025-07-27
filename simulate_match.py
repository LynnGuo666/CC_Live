#!/usr/bin/env python3
"""
Minecraft锦标赛比赛模拟器
用于测试API接口和实时分数预测功能
"""

import requests
import time
import random
import json
from typing import List, Dict

class TournamentSimulator:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.teams = [
            "RED", "ORANGE", "BLUE", "GREEN", "YELLOW", "CYAN",
            "PURPLE", "WHITE", "PINK", "BROWN", "LIGHT_BLUE", "LIGHT_GRAY"
        ]
        self.players = {
            "RED": ["Aut_moon_white", "lao_dan", "sXKYYYY", "gdgfty"],
            "ORANGE": ["YK_yuki", "Tenacity__", "Stlinosuke", "Tamakochika"],
            "BLUE": ["AnTooLot_254890", "gumorsir", "ATRI_QWQ", "TianyaOVO"],
            "GREEN": ["StarsYu", "wsouls", "PeaceYoooooo", "ATSmok"],
            "YELLOW": ["Thunder50BMG", "LgdandLgm", "AchilliesPRIDE", "Q_Official"],
            "CYAN": ["laffeyDD724", "Kevin_Lestek", "Morton_y", "Livefaster"],
            "PURPLE": ["BaggyPark", "Nock_ZZC", "Wise_Starx", "gengER"],
            "WHITE": ["goob233", "XiuRanYing", "Needle_Python", "long_zhi_zi"],
            "PINK": ["Ning_meng_Cat", "MingMo777", "xiaoyuanxyz", "GreenHandkignt1"],
            "BROWN": ["zRenox", "Forest_Silence", "logicalkeys", "wei_xin"],
            "LIGHT_BLUE": ["xiaoheng66666", "K4ver", "xiaoyao04", "Venti_Lynn"],
            "LIGHT_GRAY": ["Frozen_Rinn", "BlankChips", "ji_mo_run", "LazyOrz"]
        }
        
        # 宾果时速物品列表
        self.bingo_items = [
            "diamond", "emerald", "gold_ingot", "iron_ingot", "coal",
            "redstone", "lapis_lazuli", "wheat", "carrot", "potato",
            "oak_log", "birch_log", "stone", "cobblestone", "sand"
        ]
        
    def simulate_bingo_speed(self, game_id="bingo_speed_round1"):
        """模拟宾果时速游戏"""
        print(f"开始模拟宾果时速游戏: {game_id}")
        
        # 初始化游戏
        init_response = requests.post(f"{self.base_url}/api/{game_id}/initialize", 
                                    json={"teams": self.teams, "players": self.players})
        print(f"游戏初始化: {init_response.json()}")
        
        # 模拟游戏开始
        requests.post(f"{self.base_url}/api/game/event", json={
            "status": "gaming",
            "game": {"name": "宾果时速", "round": 1}
        })
        
        # 模拟物品发现事件
        for round_num in range(5):  # 模拟5轮物品发现
            item = random.choice(self.bingo_items)
            team = random.choice(self.teams)
            player = random.choice(self.players[team])
            
            print(f"Round {round_num + 1}: {player} ({team}) 找到了 {item}")
            
            # 发送游戏事件
            event_response = requests.post(f"{self.base_url}/api/{game_id}/event", json={
                "player": player,
                "team": team,
                "event": "Item_Found",
                "lore": item
            })
            
            print(f"事件响应: {event_response.json()}")
            time.sleep(2)  # 等待2秒
            
        print("宾果时速游戏模拟完成\n")
        
    def simulate_parkour_chase(self, game_id="parkour_chase_round1"):
        """模拟跑酷追击游戏"""
        print(f"开始模拟跑酷追击游戏: {game_id}")
        
        # 初始化游戏
        requests.post(f"{self.base_url}/api/{game_id}/initialize", 
                     json={"teams": self.teams, "players": self.players})
        
        # 回合开始
        requests.post(f"{self.base_url}/api/{game_id}/event", json={
            "player": "",
            "team": "",
            "event": "Round_Start",
            "lore": ""
        })
        
        # 选择追击者
        chaser = random.choice(self.players["RED"])
        requests.post(f"{self.base_url}/api/{game_id}/event", json={
            "player": chaser,
            "team": "RED",
            "event": "Chaser_Selected",
            "lore": ""
        })
        print(f"追击者: {chaser}")
        
        # 模拟标记事件
        for i in range(3):
            victim = random.choice(self.players["BLUE"])
            print(f"{chaser} 标记了 {victim}")
            
            requests.post(f"{self.base_url}/api/{game_id}/event", json={
                "player": chaser,
                "team": "RED",
                "event": "Player_Tagged",
                "lore": victim
            })
            time.sleep(3)
            
        # 回合结束
        requests.post(f"{self.base_url}/api/{game_id}/event", json={
            "player": "",
            "team": "",
            "event": "Round_Over",
            "lore": ""
        })
        
        print("跑酷追击游戏模拟完成\n")
        
    def simulate_battle_box(self, game_id="battle_box_round1"):
        """模拟斗战方框游戏"""
        print(f"开始模拟斗战方框游戏: {game_id}")
        
        # 初始化游戏
        requests.post(f"{self.base_url}/api/{game_id}/initialize", 
                     json={"teams": self.teams, "players": self.players})
        
        # 回合开始
        requests.post(f"{self.base_url}/api/{game_id}/event", json={
            "player": "",
            "team": "",
            "event": "Round_Start",
            "lore": ""
        })
        
        # 模拟击杀事件
        for i in range(4):
            killer_team = random.choice(["RED", "BLUE"])
            victim_team = "BLUE" if killer_team == "RED" else "RED"
            killer = random.choice(self.players[killer_team])
            victim = random.choice(self.players[victim_team])
            
            print(f"{killer} ({killer_team}) 击杀了 {victim} ({victim_team})")
            
            requests.post(f"{self.base_url}/api/{game_id}/event", json={
                "player": killer,
                "team": killer_team,
                "event": "Kill",
                "lore": victim
            })
            time.sleep(2)
            
        # 羊毛获胜
        winner = random.choice(self.players["RED"])
        requests.post(f"{self.base_url}/api/{game_id}/event", json={
            "player": winner,
            "team": "RED",
            "event": "Wool_Win",
            "lore": ""
        })
        print(f"{winner} (RED) 赢得了比赛!")
        
        # 回合结束
        requests.post(f"{self.base_url}/api/{game_id}/event", json={
            "player": "",
            "team": "",
            "event": "Round_Over",
            "lore": ""
        })
        
        print("斗战方框游戏模拟完成\n")
        
    def simulate_score_update(self, game_id):
        """模拟分数更新"""
        print(f"模拟 {game_id} 的分数更新")
        
        scores = []
        for team in self.teams:
            for player in self.players[team]:
                score = random.randint(10, 100)
                scores.append({
                    "player": player,
                    "team": team,
                    "score": score
                })
        
        response = requests.post(f"{self.base_url}/api/{game_id}/score", json=scores)
        print(f"分数更新响应: {response.json()}")
        
    def simulate_global_score_update(self):
        """模拟全局分数更新"""
        print("模拟全局分数更新")
        
        global_scores = []
        for team in self.teams:
            team_players = []
            team_total = 0
            
            for player in self.players[team]:
                player_score = random.randint(50, 300)
                team_players.append({
                    "player": player,
                    "score": player_score
                })
                team_total += player_score
                
            global_scores.append({
                "team": team,
                "total_score": team_total,
                "scores": team_players
            })
        
        response = requests.post(f"{self.base_url}/api/game/score", json=global_scores)
        print(f"全局分数更新响应: {response.json()}")
        
    def simulate_voting(self):
        """模拟投票"""
        print("模拟游戏投票")
        
        games = ["宾果时速", "跑酷追击", "斗战方框", "TNT飞跃", "空岛乱斗", "烫手鳕鱼"]
        votes = []
        
        for game in games:
            ticket_count = random.randint(0, 50)
            votes.append({
                "game": game,
                "ticket": ticket_count
            })
            
        response = requests.post(f"{self.base_url}/api/vote/event", json=votes)
        print(f"投票结果: {response.json()}")
        
    def run_full_simulation(self):
        """运行完整的锦标赛模拟"""
        print("=" * 50)
        print("    Minecraft锦标赛模拟器开始运行")
        print("=" * 50)
        
        try:
            # 模拟投票阶段
            self.simulate_voting()
            time.sleep(2)
            
            # 模拟各种游戏
            self.simulate_bingo_speed()
            self.simulate_score_update("bingo_speed_round1")
            time.sleep(3)
            
            self.simulate_parkour_chase()
            self.simulate_score_update("parkour_chase_round1")
            time.sleep(3)
            
            self.simulate_battle_box()
            self.simulate_score_update("battle_box_round1")
            time.sleep(3)
            
            # 模拟全局分数更新
            self.simulate_global_score_update()
            
            print("=" * 50)
            print("    锦标赛模拟完成")
            print("=" * 50)
            
        except requests.exceptions.ConnectionError:
            print("错误: 无法连接到服务器，请确保服务器正在运行")
        except Exception as e:
            print(f"模拟过程中发生错误: {e}")

if __name__ == "__main__":
    simulator = TournamentSimulator()
    simulator.run_full_simulation()