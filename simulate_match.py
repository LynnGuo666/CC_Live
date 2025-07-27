#!/usr/bin/env python3
"""
MC小游戏比赛模拟器
模拟真实比赛环境，按时间间隔发送各种游戏数据到后端API

功能:
- 模拟创建锦标赛和比赛阶段
- 模拟玩家游戏事件（击杀、死亡、获得物品等）
- 模拟玩家分数更新和排行榜变化
- 模拟团队统计数据
- 模拟投票环节
- 支持多种小游戏类型（宾果时速、跑酷追击、团队对抗等）

使用方法:
python simulate_match.py [--server-url http://localhost:8000] [--match-type bingo]
"""

import asyncio
import aiohttp
import json
import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
import argparse
import sys


class MatchSimulator:
    """比赛模拟器主类"""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        """
        初始化模拟器
        
        Args:
            server_url: 后端服务器地址
        """
        self.server_url = server_url
        self.session = None
        self.tournament_id = None
        self.current_stage_id = None
        self.current_match_id = None
        
        # 模拟玩家数据
        self.players = [
            "Steve", "Alex", "Herobrine", "Notch", "Dream", 
            "TechnoBlade", "Philza", "Wilbur", "Tommy", "Tubbo",
            "Ranboo", "George", "Sapnap", "BadBoyHalo", "Skeppy"
        ]
        
        # 模拟团队
        self.teams = {
            "红队": ["Steve", "Alex", "Herobrine", "Notch"],
            "蓝队": ["Dream", "TechnoBlade", "Philza", "Wilbur"], 
            "绿队": ["Tommy", "Tubbo", "Ranboo", "George"],
            "黄队": ["Sapnap", "BadBoyHalo", "Skeppy"]
        }
        
        # 玩家当前状态
        self.player_stats = {
            player: {
                "score": 0,
                "level": 1,
                "health": 100,
                "experience": 0,
                "kills": 0,
                "deaths": 0
            }
            for player in self.players
        }
        
        # 游戏类型配置
        self.game_types = {
            "bingo": {
                "name": "宾果时速",
                "duration": 300,  # 5分钟
                "events": ["item_collected", "objective_completed", "bingo_line"],
                "description": "收集指定物品完成宾果线的竞速游戏"
            },
            "parkour": {
                "name": "跑酷追击",
                "duration": 180,  # 3分钟
                "events": ["checkpoint_reached", "player_fell", "time_bonus"],
                "description": "通过各种障碍到达终点的跑酷比赛"
            },
            "pvp": {
                "name": "团队对抗",
                "duration": 600,  # 10分钟
                "events": ["player_killed", "player_death", "team_score"],
                "description": "多团队PVP对战"
            },
            "build": {
                "name": "建筑大赛",
                "duration": 900,  # 15分钟
                "events": ["block_placed", "structure_completed", "creativity_bonus"],
                "description": "限时建筑创作比赛"
            }
        }

    async def __aenter__(self):
        """异步上下文管理器入口"""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self.session:
            await self.session.close()

    async def send_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None) -> Dict[Any, Any]:
        """
        发送HTTP请求到后端API
        
        Args:
            method: HTTP方法 (GET, POST, PUT, DELETE)
            endpoint: API端点路径
            data: 请求数据
            
        Returns:
            响应数据
        """
        url = f"{self.server_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url) as response:
                    return await response.json()
            elif method.upper() == "POST":
                async with self.session.post(url, json=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        print(f"❌ API请求失败: {response.status} - {await response.text()}")
                        return {}
        except Exception as e:
            print(f"❌ 请求异常: {e}")
            return {}

    async def create_tournament(self, match_type: str = "bingo") -> bool:
        """
        创建锦标赛
        
        Args:
            match_type: 比赛类型
            
        Returns:
            创建是否成功
        """
        game_config = self.game_types.get(match_type, self.game_types["bingo"])
        
        # 创建锦标赛ID
        self.tournament_id = f"tournament_{int(time.time())}"
        
        tournament_data = {
            "id": self.tournament_id,
            "title": f"MC{game_config['name']}锦标赛",
            "description": f"模拟的{game_config['description']}锦标赛",
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(hours=2)).isoformat(),
            "bilibili_room_id": "123456",
            "bilibili_url": "https://live.bilibili.com/123456",
            "max_participants": len(self.players)
        }
        
        print(f"🏆 创建锦标赛: {tournament_data['title']}")
        response = await self.send_request("POST", "/api/tournament/tournaments", tournament_data)
        
        if response:
            print(f"✅ 锦标赛创建成功: {self.tournament_id}")
            return True
        else:
            print("❌ 锦标赛创建失败")
            return False

    async def create_tournament_stages(self, match_type: str = "bingo") -> bool:
        """
        创建锦标赛阶段
        
        Args:
            match_type: 比赛类型
            
        Returns:
            创建是否成功
        """
        game_config = self.game_types.get(match_type, self.game_types["bingo"])
        
        stages = [
            {
                "id": f"{self.tournament_id}_stage_1",
                "tournament_id": self.tournament_id,
                "stage_order": 1,
                "stage_type": "game",
                "title": f"第一轮 - {game_config['name']}",
                "description": game_config['description'],
                "game_type": match_type,
                "duration_minutes": game_config['duration'] // 60,
                "config": {"round": 1, "mode": "elimination"}
            },
            {
                "id": f"{self.tournament_id}_stage_2", 
                "tournament_id": self.tournament_id,
                "stage_order": 2,
                "stage_type": "voting",
                "title": "观众投票环节",
                "description": "观众为最喜欢的选手投票",
                "duration_minutes": 5,
                "config": {"voting_type": "player_favorite"}
            },
            {
                "id": f"{self.tournament_id}_stage_3",
                "tournament_id": self.tournament_id, 
                "stage_order": 3,
                "stage_type": "game",
                "title": f"决赛 - {game_config['name']}",
                "description": f"决赛阶段的{game_config['description']}",
                "game_type": match_type,
                "duration_minutes": game_config['duration'] // 60,
                "config": {"round": 2, "mode": "final"}
            }
        ]
        
        print("📋 创建比赛阶段...")
        for stage in stages:
            response = await self.send_request(
                "POST", 
                f"/api/tournament/tournaments/{self.tournament_id}/stages",
                stage
            )
            if response:
                print(f"✅ 阶段创建成功: {stage['title']}")
            else:
                print(f"❌ 阶段创建失败: {stage['title']}")
                return False
        
        return True

    async def start_stage_and_create_match(self, stage_order: int, match_type: str = "bingo") -> bool:
        """
        开始阶段并创建对应的比赛
        
        Args:
            stage_order: 阶段顺序
            match_type: 比赛类型
            
        Returns:
            开始是否成功
        """
        stage_id = f"{self.tournament_id}_stage_{stage_order}"
        self.current_stage_id = stage_id
        
        # 开始阶段
        print(f"🚀 开始阶段: {stage_id}")
        response = await self.send_request(
            "POST",
            f"/api/tournament/tournaments/{self.tournament_id}/stages/{stage_id}/start"
        )
        
        if not response:
            print("❌ 阶段开始失败")
            return False
        
        # 为游戏阶段创建具体比赛
        if stage_order in [1, 3]:  # 只为游戏阶段创建比赛
            self.current_match_id = f"{stage_id}_match"
            game_config = self.game_types.get(match_type, self.game_types["bingo"])
            
            # 注意：这里需要直接在数据库中创建TournamentMatch记录
            # 由于没有对应的API端点，我们直接进行游戏模拟
            print(f"🎮 开始比赛: {game_config['name']}")
            
        return True

    async def simulate_game_events(self, match_type: str = "bingo", duration: int = 300):
        """
        模拟游戏事件
        
        Args:
            match_type: 比赛类型
            duration: 持续时间（秒）
        """
        if not self.current_match_id:
            print("❌ 没有活跃的比赛")
            return
            
        game_config = self.game_types.get(match_type, self.game_types["bingo"])
        events = game_config["events"]
        
        print(f"🎮 开始模拟{game_config['name']}比赛，预计{duration}秒")
        
        start_time = time.time()
        event_count = 0
        
        while time.time() - start_time < duration:
            # 随机选择事件类型和玩家
            event_type = random.choice(events)
            player = random.choice(self.players)
            
            # 根据比赛类型生成不同的事件
            event_data = await self.generate_event_data(event_type, player, match_type)
            
            # 发送游戏事件
            await self.send_game_event(event_data)
            
            # 随机更新玩家分数
            if random.random() < 0.7:  # 70%概率更新分数
                await self.update_player_score(player, match_type)
            
            # 随机更新排行榜
            if random.random() < 0.3:  # 30%概率更新排行榜
                await self.update_leaderboard()
            
            # 随机更新团队统计
            if random.random() < 0.4:  # 40%概率更新团队统计
                await self.update_team_stats()
            
            event_count += 1
            
            # 等待随机时间（1-5秒）
            await asyncio.sleep(random.uniform(1, 5))
            
            print(f"📊 已模拟 {event_count} 个事件，剩余时间: {int(duration - (time.time() - start_time))}秒")
        
        print(f"🏁 比赛结束！总共模拟了 {event_count} 个事件")

    async def generate_event_data(self, event_type: str, player: str, match_type: str) -> Dict[str, Any]:
        """生成事件数据"""
        base_data = {
            "match_id": self.current_match_id,
            "event_type": event_type,
            "player": player,
            "timestamp": datetime.now().isoformat()
        }
        
        # 根据事件类型生成特定数据
        if event_type == "item_collected":
            items = ["diamond", "gold_ingot", "emerald", "iron_ingot", "redstone"]
            base_data["data"] = {"item": random.choice(items), "count": random.randint(1, 5)}
            
        elif event_type == "player_killed":
            victim = random.choice([p for p in self.players if p != player])
            base_data["target"] = victim
            base_data["data"] = {"weapon": "sword", "distance": random.randint(1, 20)}
            
        elif event_type == "checkpoint_reached":
            base_data["data"] = {"checkpoint": random.randint(1, 10), "time": random.uniform(10, 60)}
            
        elif event_type == "objective_completed":
            base_data["data"] = {"objective": f"目标_{random.randint(1, 25)}", "points": random.randint(10, 100)}
            
        elif event_type == "bingo_line":
            base_data["data"] = {"line_type": random.choice(["row", "column", "diagonal"]), "line_number": random.randint(1, 5)}
            
        else:
            base_data["data"] = {"value": random.randint(1, 100)}
        
        return base_data

    async def send_game_event(self, event_data: Dict[str, Any]):
        """发送游戏事件"""
        await self.send_request("POST", "/api/game/events", event_data)

    async def update_player_score(self, player: str, match_type: str):
        """更新玩家分数"""
        stats = self.player_stats[player]
        
        # 根据比赛类型调整分数增长
        if match_type == "bingo":
            score_increase = random.randint(5, 25)
        elif match_type == "parkour":
            score_increase = random.randint(10, 50)
        elif match_type == "pvp":
            score_increase = random.randint(15, 75)
        else:
            score_increase = random.randint(1, 30)
        
        stats["score"] += score_increase
        stats["experience"] += random.randint(1, 10)
        
        # 随机调整其他属性
        if random.random() < 0.1:  # 10%概率升级
            stats["level"] += 1
        
        if random.random() < 0.2:  # 20%概率受伤
            stats["health"] = max(0, stats["health"] - random.randint(5, 20))
        elif random.random() < 0.3:  # 30%概率恢复血量
            stats["health"] = min(100, stats["health"] + random.randint(5, 15))
        
        # 修正为数组格式
        score_data = {
            "match_id": self.current_match_id,
            "players": [{
                "player_name": player,
                "score": stats["score"],
                "level": stats["level"],
                "health": stats["health"],
                "experience": stats["experience"],
                "custom_stats": {"kills": stats["kills"], "deaths": stats["deaths"]}
            }]
        }
        
        await self.send_request("POST", "/api/game/player-scores", score_data)

    async def update_leaderboard(self):
        """更新排行榜"""
        # 按分数排序
        sorted_players = sorted(
            self.player_stats.items(),
            key=lambda x: x[1]["score"],
            reverse=True
        )
        
        leaderboard_data = {
            "match_id": self.current_match_id,
            "leaderboard": [
                {
                    "rank": i + 1,
                    "player_name": player,
                    "total_score": stats["score"],
                    "team": self.get_player_team(player)
                }
                for i, (player, stats) in enumerate(sorted_players[:10])  # 只取前10名
            ]
        }
        
        await self.send_request("POST", "/api/game/match-leaderboard", leaderboard_data)

    async def update_team_stats(self):
        """更新团队统计"""
        teams_data = []
        
        for team_name, team_players in self.teams.items():
            total_score = sum(self.player_stats[player]["score"] for player in team_players if player in self.player_stats)
            
            team_info = {
                "team_name": team_name,
                "total_score": total_score,
                "objectives": random.randint(0, 20),
                "progress": random.randint(0, 100),
                "custom_stats": {
                    "average_level": sum(self.player_stats[player]["level"] for player in team_players if player in self.player_stats) // len(team_players),
                    "total_experience": sum(self.player_stats[player]["experience"] for player in team_players if player in self.player_stats)
                }
            }
            teams_data.append(team_info)
        
        # 修正为数组格式
        team_update = {
            "match_id": self.current_match_id,
            "teams": teams_data
        }
        
        await self.send_request("POST", "/api/game/team-stats", team_update)

    def get_player_team(self, player: str) -> str:
        """获取玩家所属团队"""
        for team_name, team_players in self.teams.items():
            if player in team_players:
                return team_name
        return "无队伍"

    async def simulate_voting_session(self):
        """模拟投票环节"""
        if not self.tournament_id or not self.current_stage_id:
            print("❌ 没有活跃的锦标赛或阶段")
            return
        
        voting_session_id = f"{self.current_stage_id}_voting"
        
        # 创建投票会话
        voting_data = {
            "id": voting_session_id,
            "tournament_id": self.tournament_id,
            "stage_id": self.current_stage_id,
            "title": "最受欢迎选手投票",
            "description": "为你最喜欢的选手投票",
            "voting_type": "single_choice",
            "allow_public_voting": True,
            "max_votes_per_user": 1,
            "voting_config": {"anonymous": True}
        }
        
        print("🗳️ 创建投票会话...")
        response = await self.send_request("POST", "/api/tournament/voting-sessions", voting_data)
        
        if not response:
            print("❌ 投票会话创建失败")
            return
        
        # 添加投票选项（选择前几名选手）
        top_players = sorted(
            self.player_stats.items(),
            key=lambda x: x[1]["score"],
            reverse=True
        )[:5]  # 取前5名
        
        print("📝 添加投票选项...")
        for player, stats in top_players:
            await self.send_request(
                "POST",
                f"/api/tournament/voting-sessions/{voting_session_id}/options",
                {
                    "option_text": f"{player} (分数: {stats['score']})",
                    "description": f"等级 {stats['level']}, 经验 {stats['experience']}"
                }
            )
        
        # 模拟投票
        print("🗳️ 开始模拟投票...")
        voter_count = 50
        for i in range(voter_count):
            chosen_player = random.choice(top_players)[0]
            option_id = f"{voting_session_id}_option_{top_players.index((chosen_player, self.player_stats[chosen_player])) + 1}"
            
            vote_data = {
                "session_id": voting_session_id,
                "option_id": option_id,
                "voter_id": f"viewer_{i}",
                "voter_type": "public",
                "vote_weight": 1.0
            }
            
            await self.send_request("POST", "/api/tournament/votes", vote_data)
            
            if i % 10 == 0:
                print(f"📊 已收集 {i + 1} 票...")
            
            await asyncio.sleep(0.1)  # 短暂延迟
        
        # 获取投票结果
        results = await self.send_request("GET", f"/api/tournament/voting-sessions/{voting_session_id}/results")
        if results:
            print("🏆 投票结果:")
            for option in results.get("options", []):
                print(f"  {option['option_text']}: {option['vote_count']} 票 ({option['percentage']}%)")

    async def run_full_tournament(self, match_type: str = "bingo"):
        """运行完整的锦标赛"""
        print("🎯 开始完整锦标赛模拟")
        
        # 1. 创建锦标赛
        if not await self.create_tournament(match_type):
            return
        
        # 2. 创建阶段
        if not await self.create_tournament_stages(match_type):
            return
        
        # 3. 运行第一轮比赛
        print("\n=== 第一轮比赛 ===")
        await self.start_stage_and_create_match(1, match_type)
        await self.simulate_game_events(match_type, duration=120)  # 2分钟快速模拟
        
        # 4. 投票环节
        print("\n=== 投票环节 ===")
        await self.start_stage_and_create_match(2, match_type)
        await self.simulate_voting_session()
        
        # 5. 决赛
        print("\n=== 决赛 ===")
        await self.start_stage_and_create_match(3, match_type)
        await self.simulate_game_events(match_type, duration=180)  # 3分钟决赛
        
        print("\n🎊 锦标赛模拟完成！")
        print(f"🏆 锦标赛ID: {self.tournament_id}")
        
        # 显示最终结果
        print("\n📊 最终排行榜:")
        sorted_players = sorted(
            self.player_stats.items(),
            key=lambda x: x[1]["score"],
            reverse=True
        )
        
        for i, (player, stats) in enumerate(sorted_players[:5]):
            print(f"  {i+1}. {player} - 分数: {stats['score']}, 等级: {stats['level']}")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="MC小游戏比赛模拟器")
    parser.add_argument("--server-url", default="http://localhost:8000", help="后端服务器地址")
    parser.add_argument("--match-type", choices=["bingo", "parkour", "pvp", "build"], 
                       default="bingo", help="比赛类型")
    parser.add_argument("--mode", choices=["full", "game-only", "voting-only"], 
                       default="full", help="模拟模式")
    parser.add_argument("--duration", type=int, default=300, help="游戏持续时间（秒）")
    
    args = parser.parse_args()
    
    print(f"🎮 MC小游戏比赛模拟器")
    print(f"🌐 服务器地址: {args.server_url}")
    print(f"🎯 比赛类型: {args.match_type}")
    print(f"⏱️  模拟模式: {args.mode}")
    print("=" * 50)
    
    async with MatchSimulator(args.server_url) as simulator:
        try:
            if args.mode == "full":
                await simulator.run_full_tournament(args.match_type)
            elif args.mode == "game-only":
                # 仅模拟游戏事件
                if await simulator.create_tournament(args.match_type):
                    await simulator.create_tournament_stages(args.match_type)
                    await simulator.start_stage_and_create_match(1, args.match_type)
                    await simulator.simulate_game_events(args.match_type, args.duration)
            elif args.mode == "voting-only":
                # 仅模拟投票
                if await simulator.create_tournament(args.match_type):
                    await simulator.create_tournament_stages(args.match_type)
                    await simulator.start_stage_and_create_match(2, args.match_type)
                    await simulator.simulate_voting_session()
                    
        except KeyboardInterrupt:
            print("\n⏹️  模拟已停止")
        except Exception as e:
            print(f"❌ 模拟过程中出现错误: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())