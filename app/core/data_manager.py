"""
数据管理器
集中管理所有实时数据，包括积分榜、事件列表、投票数据等
支持定时广播机制
"""

import asyncio
from typing import List, Dict, Optional
from pathlib import Path
import os
import json
from datetime import datetime
from app.models.models import TeamScore, GameEvent, VoteEvent, GlobalEvent, BingoCard
from app.core.websocket import connection_manager
from app.core.tournament_manager import tournament_manager
from app.core.score_engine import score_engine
import httpx


class DataManager:
    def __init__(self):
        # 存储全局积分榜数据
        self.global_scores: List[TeamScore] = []
        
        # 存储当前游戏积分数据
        self.current_game_score = None
        
        # 存储投票数据
        self.current_vote_data: Optional[VoteEvent] = None
        
        # 存储游戏状态
        self.game_status = None
        
        # 存储所有事件的完整列表（带时间戳）
        self.events_history: List[Dict] = []
        
        # 广播任务引用
        self.broadcast_task = None
        
        # 是否启用定时广播
        self.auto_broadcast_enabled = True
        
        # Bingo 卡片（如果收到则存储并广播）
        self.bingo_card: Optional[BingoCard] = None
        
        # 物品图片缓存：mcid -> image_url
        self.item_image_cache: Dict[str, Optional[str]] = {}
        # 中文标题缓存：query -> zh_title
        self.zh_title_cache: Dict[str, str] = {}
        # OpenAI 配置（可选）：通过环境变量注入
        self.openai_base = os.environ.get("OPENAI_BASE_URL")
        self.openai_key = os.environ.get("OPENAI_API_KEY")

        # 处理进度：用于前端查询
        self.progress_bingo: Dict[str, Dict[str, int]] = {
            'images': { 'total': 0, 'done': 0 },
            'localize': { 'total': 0, 'done': 0 },
            'updated_at_ms': 0,
        }

        # 观赛ID持久化文件路径（JSON Lines），可通过环境变量覆盖
        default_path = Path("data") / "viewer_ids.jsonl"
        self.viewer_log_path: Path = Path(os.environ.get("VIEWER_LOG_PATH", str(default_path)))
        try:
            self.viewer_log_path.parent.mkdir(parents=True, exist_ok=True)
            if not self.viewer_log_path.exists():
                self.viewer_log_path.touch()
        except Exception as e:
            print(f"初始化观赛ID日志文件失败: {e}")
    
    def add_event(self, event: GameEvent, game_id: str):
        """
        添加新事件到历史记录中
        
        参数:
            event (GameEvent): 游戏事件
            game_id (str): 游戏ID
        """
        event_with_timestamp = {
            "player": event.player,
            "team": event.team,
            "event": event.event,
            "lore": event.lore,
            "game_id": game_id,
            "timestamp": datetime.now().isoformat(),
            "post_time": datetime.now().isoformat()  # 添加post到服务器的时间
        }
        
        # 添加到事件历史记录
        self.events_history.append(event_with_timestamp)
        
        # 保持最新的100条事件
        if len(self.events_history) > 100:
            self.events_history = self.events_history[-100:]
        
        print(f"添加事件: {event.player} - {event.event} (游戏: {game_id})")
    
    def update_global_scores(self, team_scores: List[TeamScore]):
        """
        更新全局积分榜数据
        
        参数:
            team_scores (List[TeamScore]): 队伍分数列表
        """
        self.global_scores = team_scores
        print(f"更新全局积分榜: {len(team_scores)} 个队伍")
    
    def update_current_game_score(self, score_data):
        """
        更新当前游戏积分数据
        
        参数:
            score_data: 当前游戏积分数据
        """
        self.current_game_score = score_data
        print("更新当前游戏积分数据")
    
    def update_vote_data(self, vote_data: VoteEvent):
        """
        更新投票数据
        
        参数:
            vote_data (VoteEvent): 投票事件数据
        """
        self.current_vote_data = vote_data
        print(f"更新投票数据: {len(vote_data.votes)} 个选项, 剩余时间: {vote_data.time}秒")
    
    def update_game_status(self, event: GlobalEvent):
        """
        更新游戏状态
        
        参数:
            event (GlobalEvent): 全局事件
        """
        # 获取游戏在锦标赛中的信息
        current_game_info = tournament_manager.get_current_game_info()
        tournament_number = current_game_info["number"] if current_game_info else 0
        
        self.game_status = {
            "status": event.status,
            "game": {
                "name": event.game.name if event.game else None,
                "round": event.game.round if event.game else None,
                "tournament_number": tournament_number
            } if event.game else None
        }
        print(f"更新游戏状态: {event.status}")
    
    def get_complete_data(self) -> Dict:
        """
        获取所有完整数据用于广播
        
        返回:
            Dict: 包含所有实时数据的完整数据包
        """
        full_data = {
            "type": "full_data_update",
            "data": {
                "globalScores": [
                    {
                        "team": getattr(team, 'team', None),
                        "total_score": getattr(team, 'total_score', 0),
                        "player_count": len(getattr(team, 'scores', []) or []),
                        "color": getattr(team, 'color', None),
                        "scores": [
                            {
                                "player": score.player,
                                "score": score.score
                            } for score in (getattr(team, 'scores', []) or [])
                        ]
                    } for team in (self.global_scores or [])
                ],
                "currentGameScore": self.current_game_score,
                "bingoCard": self._serialize_bingo_card() if self.bingo_card else None,
                 # 后端统一提供物品图片映射，前端不再尝试解析，避免闪烁
                 "itemImages": self.item_image_cache,
                "currentVote": {
                    "time_remaining": self.current_vote_data.time,
                    "total_games": len(self.current_vote_data.votes),
                    "total_tickets": sum(vote.ticket for vote in self.current_vote_data.votes),
                    "votes": [
                        {
                            "game": vote.game,
                            "ticket": vote.ticket
                        } for vote in self.current_vote_data.votes
                    ]
                } if self.current_vote_data else None,
                "gameStatus": self.game_status,
                # 发送最新20条事件（按时间倒序，最新在前）
                "recentEvents": list(reversed(self.events_history[-20:])),
                "connectionStatus": {
                    "connected": True,
                    "connection_count": connection_manager.get_connection_count(),
                    "last_ping": datetime.now().isoformat()
                }
            },
            "timestamp": datetime.now().isoformat()
        }

        # 针对跑路战士，附带检查点与完成路线汇总，方便前端渲染
        try:
            if score_engine.current_game_id == 'runaway_warrior':
                summary = self._build_runaway_warrior_summary()
                full_data["data"]["runawayWarrior"] = summary
        except Exception as e:
            print(f"构建跑路战士汇总信息失败: {e}")

        return full_data

    def get_viewer_stats(self) -> Dict:
        """汇总已提交观赛ID的统计信息。"""
        try:
            clients = connection_manager.get_client_list()
        except Exception:
            clients = []

        # 收集所有非空 viewer_id
        viewer_ids = [c.get("viewer_id") for c in clients if c.get("viewer_id")]
        # 去重
        unique_viewer_ids = sorted(set(viewer_ids))

        # 读取持久化文件，做去重统计
        persisted_ids: List[str] = []
        try:
            with self.viewer_log_path.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        rec = json.loads(line)
                        vid = rec.get("viewer_id")
                        if vid:
                            persisted_ids.append(vid)
                    except Exception:
                        continue
        except Exception as e:
            print(f"读取观赛ID日志失败: {e}")

        unique_persisted = sorted(set(persisted_ids))

        return {
            "online": {
                "count": len(unique_viewer_ids),
                "viewer_ids": unique_viewer_ids,
            },
            "persisted": {
                "count": len(unique_persisted),
                "viewer_ids": unique_persisted,
                "file": str(self.viewer_log_path),
            },
        }

    def record_viewer_id(self, viewer_id: str, *, client_id: Optional[str] = None):
        """将观赛ID写入本地 JSONL 文件。"""
        if not viewer_id:
            return
        record = {
            "viewer_id": viewer_id,
            "client_id": client_id,
            "timestamp": datetime.now().isoformat()
        }
        try:
            with self.viewer_log_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"写入观赛ID日志失败: {e}")

    def update_bingo_card(self, card: BingoCard):
        """更新 Bingo 卡片，并准备广播"""
        # 适配任务展示：解析 name/description 中的 Adventure Text，归一化类型
        try:
            for key, task in (card.tasks or {}).items():
                # 归一化类型
                t = getattr(task, 'type', '')
                task.task_kind = self._normalize_task_kind(t)
                # 解析展示用文案
                task.display_name = self._parse_adventure_text(getattr(task, 'name', ''))
                task.display_description = self._parse_adventure_text(getattr(task, 'description', ''))
        except Exception as e:
            print(f"适配 Bingo 任务展示失败: {e}")

        self.bingo_card = card
        print("更新 Bingo 卡片: {}x{} size={}".format(card.width, card.height, card.size))
        # 初始化进度，并行预热图片
        try:
            mats = self._extract_bingo_materials(card)
            total_tasks = len(card.tasks or {})
            self.progress_bingo['images'] = { 'total': len(mats), 'done': 0 }
            self.progress_bingo['localize'] = { 'total': total_tasks, 'done': 0 }
            self.progress_bingo['updated_at_ms'] = int(datetime.now().timestamp() * 1000)

            async def _warmup():
                for m in mats:
                    try:
                        await self.resolve_item_image(m)
                        self.progress_bingo['images']['done'] += 1
                        self.progress_bingo['updated_at_ms'] = int(datetime.now().timestamp() * 1000)
                    except Exception:
                        pass
            asyncio.create_task(_warmup())
        except Exception as e:
            print(f"预解析 Bingo 物品图片失败: {e}")

        # 异步本地化任务标题/描述为中文
        try:
            asyncio.create_task(self._localize_bingo_card_inplace())
        except Exception as e:
            print(f"异步本地化 Bingo 卡片失败: {e}")

    def _extract_bingo_materials(self, card: BingoCard) -> List[str]:
        materials: List[str] = []
        try:
            for _key, task in (card.tasks or {}).items():
                mat = getattr(task, 'material', None)
                if mat and isinstance(mat, str):
                    materials.append(mat)
        except Exception:
            pass
        # 去重并保持稳定顺序
        seen = set()
        unique: List[str] = []
        for m in materials:
            if m not in seen:
                unique.append(m)
                seen.add(m)
        return unique

    async def warmup_item_images(self, materials: List[str], *, concurrency: int = 5):
        """并发预热一批 material 的图片，确保首帧广播就有可用图片。"""
        if not materials:
            return
        sem = asyncio.Semaphore(concurrency)

        async def _one(m: str):
            async with sem:
                try:
                    await self.resolve_item_image(m)
                except Exception:
                    pass

        await asyncio.gather(*[_one(m) for m in materials])

    def _normalize_task_kind(self, raw_type: Optional[str]) -> str:
        if not raw_type:
            return 'other'
        t = str(raw_type).lower()
        if t in ('item', 'advancement', 'statistic', 'kill', 'craft', 'mine'):
            return t
        # 服务器可能传大写
        mapping = {
            'item': 'item',
            'advancement': 'advancement',
            'statistic': 'statistic',
            'kill': 'kill',
            'craft': 'craft',
            'mine': 'mine'
        }
        return mapping.get(t, 'other')

    def _parse_adventure_text(self, raw: Optional[str]) -> str:
        if not raw:
            return ''
        try:
            if ('TextComponentImpl' not in raw) and ('TranslatableComponentImpl' not in raw):
                return raw
            result_parts: List[str] = []
            import re
            for m in re.finditer(r'content=\"([^\"]*)\"', raw):
                val = m.group(1)
                if val:
                    result_parts.append(val)
            for m in re.finditer(r'TranslatableComponentImpl\{key=\"([^\"]+)\"', raw):
                key = m.group(1)
                pretty = key.split('.')[-1].replace('_', ' ')
                titled = re.sub(r'\b\w', lambda c: c.group(0).upper(), pretty)
                result_parts.append(titled)
            result = ' '.join(result_parts).strip()
            return result or raw
        except Exception:
            return raw

    def _serialize_bingo_card(self) -> Dict:
        """将 BingoCard 转为可 JSON 序列化的 dict，以与前端类型兼容"""
        if not self.bingo_card:
            return None
        # Pydantic BaseModel 的 dict() 即可满足，但确保 keys 为字符串 "x,y"
        return self.bingo_card.dict()

    async def resolve_item_image(self, mcid: str, *, max_attempts: int = 5, delay_seconds: float = 0.5) -> Optional[str]:
        """
        轮询解析 MC 物品ID 的图片地址，优先使用缓存；若没有则通过 Minecraft Wiki API 获取。
        成功则缓存并返回 URL；失败返回 None 并缓存，避免重复请求。
        """
        if not mcid:
            return None
        if mcid in self.item_image_cache:
            return self.item_image_cache[mcid]

        # 先尝试候选直链（复用此前前端策略）：
        # zh.minecraft.wiki images、minecraft.wiki images、minecraftitemids、fandom静态库
        candidates = self._build_image_candidates(mcid)
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1) 直链探测（HEAD/GET）
            for url in candidates:
                try:
                    resp = await client.head(url)
                    if resp.status_code == 405:
                        resp = await client.get(url)
                    if resp.status_code == 200 and ('image' in resp.headers.get('content-type', '')):
                        self.item_image_cache[mcid] = url
                        return url
                except Exception:
                    pass

            # 2) MediaWiki API 搜索与 titles 兜底（多次重试）
            # Minecraft Wiki（新域名）：优先 zh.minecraft.wiki，失败再退到 fandom zh
            page_title = mcid.replace('_', ' ').title()
            api_bases = [
                "https://zh.minecraft.wiki/api.php",
                "https://minecraft.fandom.com/zh/api.php",
            ]
            for _ in range(max_attempts):
                try:
                    # 尝试：generator=search
                    found_src: Optional[str] = None
                    for api_url in api_bases:
                        search_params = {
                            "action": "query",
                            "format": "json",
                            "prop": "pageimages",
                            "pithumbsize": 128,
                            "generator": "search",
                            "gsrsearch": mcid,
                            "redirects": 1
                        }
                        resp = await client.get(api_url, params=search_params)
                        data = resp.json()
                        pages = data.get('query', {}).get('pages', {})
                        for _, page in pages.items():
                            thumb = page.get('thumbnail', {})
                            src = thumb.get('source')
                            if src:
                                found_src = src
                                break
                        if found_src:
                            break

                    # 若搜索未命中，使用 titles 兜底
                    if not found_src:
                        for api_url in api_bases:
                            titles_params = {
                                "action": "query",
                                "format": "json",
                                "prop": "pageimages",
                                "pithumbsize": 128,
                                "titles": page_title,
                                "redirects": 1
                            }
                            resp = await client.get(api_url, params=titles_params)
                            data = resp.json()
                            pages = data.get('query', {}).get('pages', {})
                            for _, page in pages.items():
                                thumb = page.get('thumbnail', {})
                                src = thumb.get('source')
                                if src:
                                    found_src = src
                                    break
                            if found_src:
                                break

                    if found_src:
                        # 转发到下一跳 CDN：避免跨域或未来域名变动
                        self.item_image_cache[mcid] = found_src
                        return found_src
                except Exception as e:
                    print(f"获取物品图片失败: {mcid} {e}")
                # 暂无结果，等待后重试
                await asyncio.sleep(delay_seconds)

        # 最终失败，写入None以避免频繁命中
        self.item_image_cache[mcid] = None
        return None

    def _build_image_candidates(self, mcid: str) -> List[str]:
        """构造与前端一致的候选直链列表，按优先级排列。"""
        if not mcid:
            return []
        base_words = mcid.lower().split('_')
        title_case = '_'.join(w.capitalize() for w in base_words)
        # 常见 JE/BE 后缀组合（与前端相似）
        zh_names = [
            f"{title_case}_JE2_BE2.png",
            f"{title_case}_JE3_BE1.png",
            f"{title_case}_JE1_BE1.png",
            f"{title_case}.png",
        ]
        en_names = [
            f"{title_case}.png",
        ]
        zh_urls = [f"https://zh.minecraft.wiki/images/{name}" for name in zh_names]
        en_urls = [f"https://minecraft.wiki/images/{name}" for name in en_names]
        ids_urls = [f"https://minecraftitemids.com/item/32/{mcid.lower()}.png"]
        fandom_urls = [
            f"https://static.wikia.nocookie.net/minecraft_gamepedia/images/{title_case}.png",
        ]
        return zh_urls + en_urls + ids_urls + fandom_urls

    async def resolve_zh_title(self, query: str, *, timeout: float = 5.0) -> Optional[str]:
        """通过中文 Minecraft Wiki 搜索 query，返回页面中文标题。带缓存。"""
        if not query:
            return None
        if query in self.zh_title_cache:
            return self.zh_title_cache[query]
        api_url = "https://zh.minecraft.wiki/api.php"
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                params = {
                    "action": "query",
                    "format": "json",
                    "generator": "search",
                    "gsrsearch": query,
                    "gsrlimit": 1
                }
                resp = await client.get(api_url, params=params)
                data = resp.json()
                pages = data.get('query', {}).get('pages', {})
                for _, page in pages.items():
                    title = page.get('title')
                    if title:
                        self.zh_title_cache[query] = title
                        return title
        except Exception as e:
            print(f"中文标题解析失败: {query} {e}")
        return None

    async def _localize_bingo_card_inplace(self):
        """将 self.bingo_card 的 display_name/description 本地化为中文（就地修改）。"""
        card = self.bingo_card
        if not card:
            return
        tasks = card.tasks or {}
        # 并发处理，限制并发
        sem = asyncio.Semaphore(6)

        async def _proc(key: str, task_obj):
            async with sem:
                try:
                    # 仅使用 OpenAI 进行本地化（若未配置则回退原解析）
                    material = getattr(task_obj, 'material', None)
                    count = getattr(task_obj, 'count', None)
                    task_kind = getattr(task_obj, 'task_kind', None) or getattr(task_obj, 'type', None)

                    base_name = getattr(task_obj, 'display_name', None) or self._parse_adventure_text(getattr(task_obj, 'name', ''))
                    base_desc = getattr(task_obj, 'display_description', None) or self._parse_adventure_text(getattr(task_obj, 'description', ''))

                    enhanced: Optional[Dict[str, str]] = None
                    try:
                        if self.openai_base and self.openai_key:
                            enhanced = await self._openai_localize(
                                name=base_name,
                                desc=base_desc,
                                material=str(material) if material else None,
                                count=int(count) if isinstance(count, int) else None,
                                kind=str(task_kind) if task_kind else None,
                            )
                    except Exception as oe:
                        print(f"OpenAI 本地化失败: {oe}")

                    task_obj.display_name = (enhanced.get('name') if isinstance(enhanced, dict) else None) or base_name
                    task_obj.display_description = (enhanced.get('desc') if isinstance(enhanced, dict) else None) or base_desc
                    # 建议信息
                    if isinstance(enhanced, dict):
                        task_obj.advice = enhanced.get('advice') or task_obj.advice
                        task_obj.source = enhanced.get('source') or task_obj.source
                        task_obj.difficulty = enhanced.get('difficulty') or task_obj.difficulty
                    # 进度
                    self.progress_bingo['localize']['done'] += 1
                    self.progress_bingo['updated_at_ms'] = int(datetime.now().timestamp() * 1000)
                except Exception as e:
                    print(f"本地化任务失败: {e}")

        await asyncio.gather(*[_proc(k, t) for k, t in tasks.items()])
    
    async def _openai_localize(self, *, name: str, desc: str, material: Optional[str] = None, count: Optional[int] = None, kind: Optional[str] = None) -> Optional[Dict[str, str]]:
        """调用自定义 OpenAI 兼容接口，对名称/描述进行中文润色。"""
        try:
            import json as _json
            if not (self.openai_base and self.openai_key):
                return None
            url = self.openai_base.rstrip('/') + '/v1/chat/completions'
            headers = {
                'Authorization': f'Bearer {self.openai_key}',
                'Content-Type': 'application/json'
            }
            system = '你是一个将 Minecraft 物品与成就文本本地化为简体中文的助手。请：1) 输出更自然的中文标题与描述；2) 提供简要合成/完成建议；3) 给出获取途径或位置来源；4) 评估难度为 简单/中等/困难。仅返回JSON，不要多余文本。'
            meta = []
            if material:
                meta.append(f"material={material}")
            if isinstance(count, int):
                meta.append(f"count={count}")
            if kind:
                meta.append(f"kind={kind}")
            meta_line = ("，".join(meta)) if meta else ""
            user = f"请本地化并补充信息（{meta_line}）。\n名称: {name}\n描述: {desc}\n返回 JSON: {{name, desc, advice, source, difficulty}}"
            payload = {
                'model': 'gpt-5-2025-08-07',
                'messages': [
                    { 'role': 'system', 'content': system },
                    { 'role': 'user', 'content': user }
                ],
                'temperature': 0.2
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                data = resp.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                # 尝试提取 JSON
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1 and end > start:
                    text = content[start:end+1]
                    return _json.loads(text)
        except Exception as e:
            print(f"调用 OpenAI 接口失败: {e}")
        return None

    def _build_runaway_warrior_summary(self) -> Dict:
        """
        从分数引擎的内部状态构建跑路战士的检查点、通过人数与完成路线统计。
        结构示例：
        {
          "checkpoints": {
            "main0": { count: 5, players: ["p1", "p2"...] },
            "check0": { count: 3, players: [...] },
            ...
          },
          "completion": { ez: 2, mid: 5, hard: 1 },
          "order": ["main0", "check0", "check1", "check2", "sub1-0", "sub1-1", "sub1-2", "main1", ..., "main5" ]
        }
        """
        state = score_engine.runaway_warrior_state
        checkpoint_progress = state.get('checkpoint_progress', {})  # dict[player] -> List[str]
        completion_routes = state.get('completion_routes', {})       # dict[player] -> route_type

        # 聚合各检查点通过玩家与数量
        checkpoints: Dict[str, Dict[str, object]] = {}
        for player, checkpoints_list in checkpoint_progress.items():
            for cp in checkpoints_list:
                if cp not in checkpoints:
                    checkpoints[cp] = {"count": 0, "players": []}
                checkpoints[cp]["count"] = int(checkpoints[cp]["count"]) + 1
                checkpoints[cp]["players"].append(player)

        # 统计完成路线（将 simple/normal/hard 映射为 ez/mid/hard 以兼容前端文案）
        completion = {"ez": 0, "mid": 0, "hard": 0, "other": 0}
        completion_players = {"ez": [], "mid": [], "hard": [], "other": []}
        for player, route in completion_routes.items():
            key = route
            if route == 'simple':
                key = 'ez'
            elif route == 'normal':
                key = 'mid'
            elif route == 'hard':
                key = 'hard'
            if key in completion:
                completion[key] += 1
                completion_players[key].append(player)
            else:
                completion['other'] += 1
                completion_players['other'].append(player)

        # 预设顺序（按你的要求：main{i}-1..3；sub{i}-1..3 在主线之间；fin1/2/3 末尾）
        order = [
            'main0-1','main0-2','main0-3',
            'sub1-1','sub1-2','sub1-3',
            'main1-1','main1-2','main1-3',
            'sub2-1','sub2-2','sub2-3',
            'main2-1','main2-2','main2-3',
            'sub3-1','sub3-2','sub3-3',
            'main3-1','main3-2','main3-3',
            'sub4-1','sub4-2','sub4-3',
            'main4-1','main4-2','main4-3',
            'sub5-1','sub5-2','sub5-3',
            'main5-1','main5-2','main5-3',
            'fin1','fin2','fin3'
        ]

        return {
            "checkpoints": checkpoints,
            "completion": completion,
            "completionPlayers": completion_players,
            "order": order
        }
    
    async def start_broadcast_scheduler(self):
        """
        启动定时广播调度器
        """
        if self.broadcast_task is not None:
            self.broadcast_task.cancel()
        
        self.broadcast_task = asyncio.create_task(self._broadcast_loop())
        print("定时广播调度器已启动")
    
    async def stop_broadcast_scheduler(self):
        """
        停止定时广播调度器
        """
        if self.broadcast_task is not None:
            self.broadcast_task.cancel()
            self.broadcast_task = None
        print("定时广播调度器已停止")
    
    async def _broadcast_loop(self):
        """
        广播循环，每秒发送一次完整数据
        """
        while self.auto_broadcast_enabled:
            try:
                if connection_manager.get_connection_count() > 0:
                    complete_data = self.get_complete_data()
                    await connection_manager.broadcast(complete_data)
                
                await asyncio.sleep(1)  # 每1秒广播一次
            except asyncio.CancelledError:
                print("广播循环被取消")
                break
            except Exception as e:
                print(f"广播循环出错: {e}")
                await asyncio.sleep(1)  # 出错后等1秒再继续
    
    def enable_auto_broadcast(self):
        """启用自动广播"""
        self.auto_broadcast_enabled = True
    
    def disable_auto_broadcast(self):
        """禁用自动广播"""
        self.auto_broadcast_enabled = False


# 全局数据管理器实例
data_manager = DataManager()