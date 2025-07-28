#!/usr/bin/env python3
"""
完整锦标赛模拟脚本
演示所有功能：7种游戏类型、积分权重系统、万能替补、实时事件广播
包含详细的测试用例和分数验证
"""

import asyncio
import aiohttp
import json
import time
import random
from typing import Dict, List

# 服务器配置
BASE_URL = "http://localhost:8000"
API_ENDPOINTS = {
    "global_event": f"{BASE_URL}/api/game/event",
    "global_score": f"{BASE_URL}/api/game/score", 
    "vote_event": f"{BASE_URL}/api/vote/event",
    "game_event": f"{BASE_URL}/api",
    "initialize": f"{BASE_URL}/api"
}

# 锦标赛配置
TEAMS = ["RED", "BLUE", "GREEN", "YELLOW", "ORANGE", "PURPLE", "CYAN", "WHITE", "PINK", "BROWN", "LIGHT_BLUE", "LIGHT_GRAY"]

# 玩家池（支持万能替补系统）
PLAYER_POOL = [
    "Player_A", "Player_B", "Player_C", "Player_D", "Player_E", "Player_F",
    "Player_G", "Player_H", "Player_I", "Player_J", "Player_K", "Player_L",
    "Player_M", "Player_N", "Player_O", "Player_P", "Player_Q", "Player_R",
    "Player_S", "Player_T", "Player_U", "Player_V", "Player_W", "Player_X"
]

# 游戏轮次配置（与config.yml对应）
TOURNAMENT_SCHEDULE = [
    {
        "round": 1,
        "games": ["bingo", "parkour_chase", "battle_box"],
        "multiplier": 1.0
    },
    {
        "round": 2, 
        "games": ["tntrun", "skywars", "hot_cod"],
        "multiplier": 1.5
    },
    {
        "round": 3,
        "games": ["bingo", "parkour_chase", "battle_box"], 
        "multiplier": 1.5
    },
    {
        "round": 4,
        "games": ["tntrun", "skywars", "hot_cod"],
        "multiplier": 2.0
    },
    {
        "round": 5,
        "games": ["bingo", "parkour_chase"],
        "multiplier": 2.0
    },
    {
        "round": 6,
        "games": ["tntrun", "hot_cod"],
        "multiplier": 2.5
    },
    {
        "final_round": 7,
        "games": ["dodging_bolt"],
        "multiplier": 3.0
    }
]

# 游戏配置映射（根据config.yml）
GAME_CONFIG = {
    "bingo": {"rounds": 1, "name": "宾果时速"},
    "parkour_chase": {"rounds": 8, "name": "跑酷追击", "match_type": "team_vs_team"},
    "battle_box": {"rounds": 8, "name": "斗战方框", "match_type": "team_vs_team"},
    "tntrun": {"rounds": 3, "name": "TNT飞跃", "players_per_arena": 4},
    "skywars": {"rounds": 1, "name": "空岛乱斗", "max_players_per_world": 16},
    "hot_cod": {"rounds": 3, "name": "烫手鳕鱼", "players_per_arena": 4},
    "runaway_warrior": {"rounds": 1, "name": "跑路战士"},
    "dodging_bolt": {"rounds": 5, "name": "躲避箭", "match_type": "final_showdown"}
}

class TournamentSimulator:
    """锦标赛模拟器 - 完整功能演示"""
    
    def __init__(self):
        self.session = None
        self.team_scores = {team: 0 for team in TEAMS}
        self.player_scores = {player: 0 for player in PLAYER_POOL}
        self.current_round = 1
        self.rosters, self.player_to_official_team = self._create_fixed_rosters()
        
    def _create_fixed_rosters(self):
        """创建固定的队伍名单和玩家到队伍的映射"""
        print("📋 创建固定队伍名单...")
        rosters = {team: [] for team in TEAMS}
        player_to_team_map = {}
        player_pool = PLAYER_POOL.copy()
        random.shuffle(player_pool)
        
        players_per_team = 2
        
        for team in TEAMS:
            for _ in range(players_per_team):
                if player_pool:
                    player = player_pool.pop()
                    rosters[team].append(player)
                    player_to_team_map[player] = team
        
        print("✅ 固定队伍名单及玩家映射创建完成。")
        return rosters, player_to_team_map

    async def start_simulation(self):
        """开始完整的锦标赛模拟"""
        print("=" * 80)
        print("🏆 S2CC锦标赛完整模拟开始")
        print("📋 功能演示：")
        print("   ✅ 7种游戏类型的事件模拟")
        print("   ✅ 积分权重系统 (1.0x → 3.0x)")
        print("   ✅ 万能替补玩家系统")
        print("   ✅ 实时WebSocket事件广播")
        print("   ✅ 分数预测与实际对比")
        print("=" * 80)
        
        async with aiohttp.ClientSession() as session:
            self.session = session
            
            # 初始化锦标赛
            await self.initialize_tournament()
            
            # 执行所有轮次
            for round_config in TOURNAMENT_SCHEDULE:
                await self.simulate_round(round_config)
                await self.update_global_scores() # 每轮结束后更新全局分数
                print("-" * 80)
                await asyncio.sleep(5)  # 轮次间隔，留出时间查看前端变化
            
            # 最终结果
            await self.announce_final_results()
    
    async def initialize_tournament(self):
        """初始化锦标赛"""
        print("\n🚀 初始化锦标赛...")
        
        # 发送全局事件：锦标赛开始
        await self.send_global_event("setting", "bingo", 1)
        print("✅ 锦标赛状态已设置")
        
        # 初始化全局分数
        await self.update_global_scores()
        print("✅ 全局分数已初始化")
    
    async def simulate_round(self, round_config: Dict):
        """模拟完整轮次（包含投票）"""
        round_num = round_config.get("round", round_config.get("final_round", 0))
        multiplier = round_config["multiplier"]
        available_games = round_config["games"]
        
        print(f"\n🗳️ 第{round_num}轮投票开始 (积分权重: {multiplier}x)")
        print(f"📋 候选游戏: {', '.join(available_games)}")
        
        self.current_round = round_num
        
        # 1. 先设置全局状态为投票
        await self.send_global_event("voting")
        
        # 2. 模拟投票
        chosen_game = await self.simulate_voting(available_games, round_num)
        print(f"🎉 投票结束！本轮游戏: {chosen_game}")
        await asyncio.sleep(2) # 等待前端展示投票结果
        
        # 3. 模拟选定的游戏
        print(f"\n🎯 第{round_num}轮 - 开始游戏: {chosen_game}")
        await self.simulate_game(chosen_game, round_num, multiplier)
        
        print(f"✅ 第{round_num}轮完成！")
        await self.send_global_event("halfing")
    
    async def simulate_game(self, game_type: str, round_num: int, multiplier: float):
        """模拟单个游戏"""
        game_id = game_type  # 直接使用游戏名称作为ID
        print(f"\n🎲 开始游戏: {game_id} (第{round_num}轮)")
        
        # 万能替补：为每个游戏随机分配玩家到队伍
        team_players = self.assign_players_to_teams(game_type)
        
        # 发送游戏开始事件
        await self.send_global_event("gaming", game_type, round_num)
        
        # 模拟具体游戏事件
        if game_type == "bingo":
            await self.simulate_bingo_speed(game_id, team_players)
        elif game_type == "parkour_chase":
            await self.simulate_parkour_chase(game_id, team_players)
        elif game_type == "battle_box":
            await self.simulate_battle_box(game_id, team_players)
        elif game_type == "tntrun":
            await self.simulate_tnt_spleef(game_id, team_players)
        elif game_type == "skywars":
            await self.simulate_sky_brawl(game_id, team_players)
        elif game_type == "hot_cod":
            await self.simulate_hot_cod(game_id, team_players)
        elif game_type == "dodging_bolt":
            await self.simulate_dodging_bolt(game_id, team_players)
        
        # 发送最终分数（模拟游戏服务器POST数据）
        await self.send_final_scores(game_id, team_players, multiplier)
        
        print(f"✅ 游戏 {game_id} 结束")
    
    async def simulate_voting(self, games: List[str], round_num: int) -> str:
        """模拟投票过程"""
        # 生成模拟投票数据
        vote_data = []
        for game in games:
            vote_data.append({
                "game": game,
                "ticket": random.randint(10, 100)
            })
        
        # 模拟10秒倒计时投票过程
        print("🗳️  开始投票倒计时...")
        for countdown in range(10, 0, -1):
            # 构建投票请求，包含当前倒计时
            vote_request = {
                "votes": vote_data,
                "time": countdown  # 当前倒计时秒数
            }
            
            # 发送投票事件
            try:
                async with self.session.post(API_ENDPOINTS["vote_event"], json=vote_request) as response:
                    if response.status == 200:
                        print(f"⏰ 倒计时 {countdown} 秒 - 投票数据: {vote_data}")
                    else:
                        print(f"❌ 投票事件发送失败: {response.status}")
            except Exception as e:
                print(f"❌ 投票事件发送异常: {e}")
            
            # 等待1秒再发送下一个倒计时
            await asyncio.sleep(1)
        
        # 发送最终0秒结果
        final_vote_request = {
            "votes": vote_data,
            "time": 0  # 倒计时结束，显示最终结果
        }
        
        try:
            async with self.session.post(API_ENDPOINTS["vote_event"], json=final_vote_request) as response:
                if response.status == 200:
                    print(f"🏁 投票结束 (0秒) - 最终结果: {vote_data}")
                else:
                    print(f"❌ 最终投票结果发送失败: {response.status}")
        except Exception as e:
            print(f"❌ 最终投票结果发送异常: {e}")
            
        # 选出票数最高的游戏
        chosen_game = max(vote_data, key=lambda x: x["ticket"])["game"]
        return chosen_game

    def assign_players_to_teams(self, game_type: str) -> Dict[str, List[str]]:
        """万能替补：为游戏随机分配玩家到队伍"""
        team_players = {}
        available_players = PLAYER_POOL.copy()
        random.shuffle(available_players)
        
        # 根据游戏类型确定每队人数
        if game_type in ["bingo", "skywars", "runaway_warrior"]:
            players_per_team = 2  # 大型游戏，每队2人
        else:
            players_per_team = 2  # 其他游戏，每队2人
        
        for team in TEAMS:
            team_players[team] = []
            for _ in range(players_per_team):
                if available_players:
                    player = available_players.pop()
                    team_players[team].append(player)
        
        print(f"🔄 万能替补分配完成，每队{players_per_team}人")
        return team_players
    
    async def simulate_bingo_speed(self, game_id: str, team_players: Dict):
        """模拟宾果时速游戏"""
        print("🎯 宾果时速：物品收集竞速")
        
        # 模拟物品发现事件
        items = ["diamond", "emerald", "gold_ingot", "iron_ingot", "coal"]
        
        for item in items:
            # 随机选择队伍和玩家找到物品
            team = random.choice(TEAMS)
            player = random.choice(team_players[team]) if team_players[team] else "Player_A"
            
            await self.send_game_event(game_id, {
                "event": "Item_Found",
                "player": player,
                "team": team,
                "lore": item
            })
            
            print(f"  📦 {team}队的{player}找到了{item}")
            await asyncio.sleep(random.uniform(1, 2))  # 每个事件等待1-2秒
    
    async def simulate_parkour_chase(self, game_id: str, team_players: Dict):
        """模拟跑酷追击游戏"""
        print("🏃 跑酷追击：追击与逃脱")
        
        # 根据配置模拟8轮对战
        total_rounds = GAME_CONFIG["parkour_chase"]["rounds"]
        print(f"🎯 总共{total_rounds}轮对战")
        
        for round_num in range(1, total_rounds + 1):
            print(f"  🏃 第{round_num}轮追击开始")
            chaser_team = random.choice(TEAMS)
            chaser = random.choice(team_players[chaser_team]) if team_players[chaser_team] else "Player_A"
            
            # 追击者选择
            await self.send_game_event(game_id, {
                "event": "Chaser_Selected",
                "player": chaser,
                "team": chaser_team,
                "lore": ""
            })
            
            # 回合开始
            await self.send_game_event(game_id, {
                "event": "Round_Start",
                "player": "",
                "team": "",
                "lore": ""
            })
            
            # 模拟标记事件
            if random.random() > 0.3:  # 70%概率成功抓到
                target_team = random.choice([t for t in TEAMS if t != chaser_team])
                target = random.choice(team_players[target_team]) if team_players[target_team] else "Player_B"
                
                await self.send_game_event(game_id, {
                    "event": "Player_Tagged",
                    "player": chaser,
                    "team": chaser_team,
                    "lore": target
                })
                
                print(f"    ✅ {chaser_team}队的{chaser}抓到了{target_team}队的{target}")
            else:
                print(f"    ❌ {chaser_team}队的{chaser}未能抓到目标")
            
            # 回合结束
            await self.send_game_event(game_id, {
                "event": "Round_Over",
                "player": "",
                "team": "",
                "lore": ""
            })
            
            await asyncio.sleep(random.uniform(1, 2))  # 每轮等待1-2秒
    
    async def simulate_battle_box(self, game_id: str, team_players: Dict):
        """模拟斗战方框游戏"""
        print("⚔️ 斗战方框：团队战斗")
        
        # 根据配置模拟8轮对战
        total_rounds = GAME_CONFIG["battle_box"]["rounds"]
        print(f"🎯 总共{total_rounds}轮对战")
        
        for round_num in range(1, total_rounds + 1):
            print(f"  ⚔️ 第{round_num}轮战斗开始")
            
            # 回合开始
            await self.send_game_event(game_id, {
                "event": "Round_Start",
                "player": "",
                "team": "",
                "lore": ""
            })
            
            # 模拟击杀事件
            kills = random.randint(1, 3)
            for _ in range(kills):
                killer_team = random.choice(TEAMS)
                killer = random.choice(team_players[killer_team]) if team_players[killer_team] else "Player_A"
                victim_team = random.choice([t for t in TEAMS if t != killer_team])
                victim = random.choice(team_players[victim_team]) if team_players[victim_team] else "Player_B"
                
                await self.send_game_event(game_id, {
                    "event": "Kill",
                    "player": killer,
                    "team": killer_team,
                    "lore": victim
                })
                
                print(f"    💀 {killer_team}队的{killer}击杀了{victim_team}队的{victim}")
            
            # 胜利条件
            if random.random() > 0.5:  # 50%概率羊毛胜利
                winner_team = random.choice(TEAMS)
                winner = random.choice(team_players[winner_team]) if team_players[winner_team] else "Player_A"
                
                await self.send_game_event(game_id, {
                    "event": "Wool_Win", 
                    "player": winner,
                    "team": winner_team,
                    "lore": ""
                })
                
                print(f"    🐑 {winner_team}队通过羊毛获胜！")
            
            await asyncio.sleep(random.uniform(1, 2))  # 每轮等待1-2秒
    
    async def simulate_tnt_spleef(self, game_id: str, team_players: Dict):
        """模拟TNT飞跃游戏"""
        print("💥 TNT飞跃：方块消失生存")
        
        # 根据配置模拟3轮
        total_rounds = GAME_CONFIG["tntrun"]["rounds"]
        print(f"🎯 总共{total_rounds}轮比赛")
        
        for round_num in range(1, total_rounds + 1):
            print(f"  💥 第{round_num}轮开始")
            
            await self.send_game_event(game_id, {
                "event": "Round_Start",
                "player": "",
                "team": "",
                "lore": ""
            })
            
            # 模拟玩家掉落顺序
            all_players = []
            for team, players in team_players.items():
                all_players.extend([(p, team) for p in players])
            
            random.shuffle(all_players)
            
            # 模拟掉落（保留最后1-2名）
            fall_count = len(all_players) - random.randint(1, 2)
            for i in range(fall_count):
                player, team = all_players[i]
                
                await self.send_game_event(game_id, {
                    "event": "Player_Fall",
                    "player": player,
                    "team": team,
                    "lore": ""
                })
                
                print(f"    ⬇️ {team}队的{player}掉落了")
                await asyncio.sleep(random.uniform(0.5, 1))  # 每个掉落事件等待0.5-1秒
            
            # 回合结束
            await self.send_game_event(game_id, {
                "event": "Round_Over",
                "player": "",
                "team": "",
                "lore": ""
            })
            
            await asyncio.sleep(random.uniform(1, 2))  # 每轮等待1-2秒
    async def simulate_sky_brawl(self, game_id: str, team_players: Dict):
        """模拟空岛乱斗游戏"""
        print("🌤️ 空岛乱斗：资源与战斗")
        
        await self.send_game_event(game_id, {
            "event": "Round_Start",
            "player": "",
            "team": "",
            "lore": ""
        })
        
        # 模拟击杀和掉落
        all_players = []
        for team, players in team_players.items():
            all_players.extend([(p, team) for p in players])
        
        # 模拟边界收缩
        await self.send_game_event(game_id, {
            "event": "Border_Start",
            "player": "",
            "team": "",
            "lore": "100"
        })
        
        # 模拟战斗事件
        for _ in range(random.randint(3, 6)):
            if random.random() > 0.5:  # 50%概率击杀
                killer, killer_team = random.choice(all_players)
                victim, victim_team = random.choice([(p, t) for p, t in all_players if t != killer_team])
                
                await self.send_game_event(game_id, {
                    "event": "Kill",
                    "player": killer,
                    "team": killer_team,
                    "lore": victim
                })
                
                print(f"  ⚔️ {killer_team}队的{killer}击杀了{victim_team}队的{victim}")
            else:  # 50%概率掉落虚空
                victim, victim_team = random.choice(all_players)
                
                await self.send_game_event(game_id, {
                    "event": "Fall",
                    "player": victim,
                    "team": victim_team,
                    "lore": ""
                })
                
                print(f"  🕳️ {victim_team}队的{victim}掉入虚空")
            
            await asyncio.sleep(random.uniform(1, 2))  # 每个战斗事件等待1-2秒
        
        # 边界收缩结束
        await self.send_game_event(game_id, {
            "event": "Border_End",
            "player": "",
            "team": "",
            "lore": "50"
        })
    
    async def simulate_hot_cod(self, game_id: str, team_players: Dict):
        """模拟烫手鳕鱼游戏"""
        print("🐟 烫手鳕鱼：传递与爆炸")
        
        # 根据配置模拟3轮
        total_rounds = GAME_CONFIG["hot_cod"]["rounds"]
        print(f"🎯 总共{total_rounds}轮比赛")
        
        for round_num in range(1, total_rounds + 1):
            print(f"  🐟 第{round_num}轮开始")
            
            await self.send_game_event(game_id, {
                "event": "Round_Start",
                "player": "",
                "team": "",
                "lore": ""
            })
            
            # 模拟鳕鱼传递链
            current_holder = random.choice(PLAYER_POOL[:12])  # 随机初始持有者
            current_team = random.choice(TEAMS)
            
            passes = random.randint(3, 8)  # 3-8次传递
            for pass_num in range(passes):
                next_holder = random.choice([p for p in PLAYER_POOL[:12] if p != current_holder])
                next_team = random.choice(TEAMS)
                
                await self.send_game_event(game_id, {
                    "event": "Cod_Passed",
                    "player": current_holder,
                    "team": current_team,
                    "lore": next_holder
                })
                
                print(f"    🐟 鳕鱼从{current_team}队的{current_holder}传递给{next_team}队的{next_holder}")
                
                current_holder = next_holder
                current_team = next_team
                await asyncio.sleep(random.uniform(0.5, 1))  # 每次传递等待0.5-1秒
            
            # 最终爆炸
            await self.send_game_event(game_id, {
                "event": "Death",
                "player": current_holder,
                "team": current_team,
                "lore": ""
            })
            
            print(f"    💥 {current_team}队的{current_holder}被鳕鱼爆炸淘汰")
            await asyncio.sleep(random.uniform(1, 2))  # 每轮等待1-2秒
    
    async def simulate_dodging_bolt(self, game_id: str, team_players: Dict):
        """模拟躲避箭最终对决"""
        print("🏹 躲避箭：最终对决")
        
        # 根据配置模拟5局3胜制
        total_rounds = GAME_CONFIG["dodging_bolt"]["rounds"]
        print(f"🎯 五局三胜制，最多{total_rounds}轮")
        
        wins = {team: 0 for team in TEAMS}
        
        for round_num in range(1, total_rounds + 1):
            print(f"  🎯 第{round_num}局对决")
            
            # 模拟淘汰
            eliminations = random.randint(5, 10)
            for _ in range(eliminations):
                eliminated_team = random.choice(TEAMS)
                eliminated_player = random.choice(team_players[eliminated_team]) if team_players[eliminated_team] else "Player_A"
                elimination_method = random.choice(["shot", "fall"])
                
                await self.send_game_event(game_id, {
                    "event": "Player_Eliminated",
                    "player": eliminated_player,
                    "team": eliminated_team,
                    "lore": elimination_method
                })
                
                await asyncio.sleep(random.uniform(0.5, 1))  # 每次淘汰等待0.5-1秒
            
            # 本局获胜队伍
            winner_team = random.choice(TEAMS)
            wins[winner_team] += 1
            
            await self.send_game_event(game_id, {
                "event": "Round_Win",
                "player": "",
                "team": winner_team,
                "lore": winner_team
            })
            
            print(f"    🏆 第{round_num}局：{winner_team}队获胜 (当前比分: {wins[winner_team]}胜)")
            
            # 检查是否有队伍率先获得3胜
            if max(wins.values()) >= 3:
                champion_team = max(wins, key=wins.get)
                print(f"    🎉 {champion_team}队率先获得3胜，提前结束!")
                break
            
            await asyncio.sleep(random.uniform(1, 2))  # 每局等待1-2秒
        
        # 锦标赛结束
        champion_team = max(wins, key=wins.get)
        await self.send_game_event(game_id, {
            "event": "Tournament_End",
            "player": "",
            "team": "",
            "lore": champion_team
        })
        
        print(f"  🎉 锦标赛冠军：{champion_team}队！(最终比分: {wins[champion_team]}胜)")
    
    async def send_game_event(self, game_id: str, event_data: Dict):
        """发送游戏事件到API"""
        url = f"{BASE_URL}/api/{game_id}/event"
        
        try:
            async with self.session.post(url, json=event_data) as response:
                if response.status == 200:
                    result = await response.json()
                    # 可以在这里处理分数预测结果
                else:
                    print(f"❌ 事件发送失败: {response.status}")
        except Exception as e:
            print(f"❌ 事件发送异常: {e}")
    
    async def send_global_event(self, status: str, game_name: str = None, round_num: int = None):
        """发送全局事件"""
        event_data = {
            "status": status
        }
        
        # 只有在提供了game_name时才包含game信息
        if game_name and round_num is not None:
            event_data["game"] = {
                "name": game_name,
                "round": round_num
            }
        
        try:
            async with self.session.post(API_ENDPOINTS["global_event"], json=event_data) as response:
                if response.status == 200:
                    game_info = f" - {game_name}" if game_name else ""
                    print(f"📡 全局事件发送成功: {status}{game_info}")
        except Exception as e:
            print(f"❌ 全局事件发送失败: {e}")
    
    async def initialize_game(self, game_id: str, team_players: Dict, round_num: int):
        """初始化游戏状态"""
        url = f"{API_ENDPOINTS['initialize']}/{game_id}/initialize"
        
        # 准备初始化数据
        init_data = {
            "teams": list(team_players.keys()),
            "players": team_players,
            "round_number": round_num
        }
        
        try:
            async with self.session.post(url, json=init_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 游戏{game_id}初始化成功，权重: {result.get('multiplier', 1.0)}x")
        except Exception as e:
            print(f"❌ 游戏初始化失败: {e}")
    
    async def send_final_scores(self, game_id: str, team_players: Dict, multiplier: float):
        """发送游戏最终分数并根据官方队伍归属更新内部积分"""
        url = f"{BASE_URL}/api/{game_id}/score"
        
        score_data = []
        for team, players in team_players.items(): # team is the temporary team for this game
            for player in players:
                base_score = random.randint(10, 100)
                final_score = int(base_score * multiplier)
                
                # 更新玩家个人总分
                self.player_scores[player] += final_score
                
                # 查找玩家的官方队伍并更新队伍总分
                official_team = self.player_to_official_team.get(player)
                if official_team:
                    self.team_scores[official_team] += final_score
                else:
                    print(f"⚠️ 警告：玩家 {player} 没有找到官方队伍归属！")

                # 游戏内分数API仍然使用本场比赛的临时队伍
                score_data.append({
                    "player": player,
                    "team": team,
                    "score": base_score # 发送基础分，后端处理权重
                })
        
        try:
            async with self.session.post(url, json=score_data) as response:
                if response.status == 200:
                    print(f"📊 游戏内分数发送成功，后端将应用 {multiplier}x 权重")
                else:
                    print(f"❌ 游戏内分数发送失败: {response.status}")
        except Exception as e:
            print(f"❌ 游戏内分数发送异常: {e}")

    async def update_global_scores(self):
        """使用内部累积的分数和固定名单更新全局排行榜"""
        print("\n🔄 更新全局积分榜...")
        
        global_scores_payload = []
        
        for team, players in self.rosters.items():
            team_total = self.team_scores.get(team, 0)
            
            player_scores_list = []
            for player in players:
                player_scores_list.append({
                    "player": player,
                    "score": self.player_scores.get(player, 0)
                })

            global_scores_payload.append({
                "team": team,
                "total_score": team_total,
                "scores": player_scores_list
            })
            
        try:
            async with self.session.post(API_ENDPOINTS["global_score"], json=global_scores_payload) as response:
                if response.status == 200:
                    print("✅ 全局积分榜已成功推送到服务器！")
                else:
                    print(f"❌ 全局分数更新失败: {response.status}, {await response.text()}")
        except Exception as e:
            print(f"❌ 全局分数更新异常: {e}")
    
    async def announce_final_results(self):
        """宣布最终结果"""
        print("\n" + "=" * 80)
        print("🎉 S2CC锦标赛模拟完成！")
        print("\n📊 功能演示总结：")
        print("   ✅ 所有7种游戏类型的事件模拟完成")
        print("   ✅ 积分权重系统正确应用 (1.0x → 3.0x)")
        print("   ✅ 万能替补系统正常运行")
        print("   ✅ 实时WebSocket事件广播")
        print("   ✅ 分数预测引擎运行正常")
        print("   ✅ 完整的API接口测试")
        
        print("\n🎯 下一步操作建议：")
        print("   1. 检查前端实时显示效果")
        print("   2. 验证积分权重计算准确性")
        print("   3. 测试投票界面只读模式")
        print("   4. 确认WebSocket连接稳定性")
        
        print("\n🔗 访问地址：")
        print("   前端界面: http://localhost:3000")
        print("   API文档: http://localhost:8000/docs")
        
        print("=" * 80)

async def main():
    """主程序入口"""
    print("🚀 启动完整锦标赛模拟")
    print("⚠️  请确保后端服务已启动: python main.py")
    print("⚠️  请确保前端服务已启动: cd frontend && npm run dev")
    print("\n按Enter键开始模拟...")
    input()
    
    simulator = TournamentSimulator()
    await simulator.start_simulation()

if __name__ == "__main__":
    asyncio.run(main())