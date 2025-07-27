# MC小游戏比赛在线直播系统

## 项目介绍
基于FastAPI + NextJS的小游戏比赛直播系统，支持实时文字直播和B站视频直播切换。

## 🚀 一键启动

### Linux/macOS
```bash
chmod +x start.sh
./start.sh
```

### Windows
```cmd
start.bat
```

**就这么简单！脚本会自动：**
- ✅ 检查环境依赖
- ✅ 安装Python和前端依赖
- ✅ 构建前端应用
- ✅ 启动服务器

访问: http://localhost:8000

## 功能特性
- ✅ 接收游戏服务器POST数据
- ✅ 实时WebSocket推送
- ✅ 文字直播展示
- ✅ B站视频直播集成
- ✅ 用户评论弹幕
- ✅ 比赛数据统计
- ✅ 排行榜实时更新
- ✅ 玩家详细数据面板
- ✅ 响应式设计
- ✅ SQLite数据库（无需安装）

## 技术栈
- **后端**: FastAPI + SQLAlchemy + SQLite
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **实时通信**: WebSocket
- **状态管理**: Zustand
- **数据库**: SQLite + JSONB

## 环境要求
- **Python**: 3.8+
- **Node.js**: 18+
- **npm**: 8+

## 启动选项

### 开发模式（快速启动）
```bash
./start.sh --dev
```

### 跳过依赖安装
```bash
./start.sh --skip-deps
```

### 查看所有选项
```bash
./start.sh --help
```

## API接口文档

### 游戏数据接收接口
- `POST /api/game/events` - 实时游戏事件
- `POST /api/game/player-scores` - 玩家分数更新
- `POST /api/game/match-leaderboard` - 比赛排行榜
- `POST /api/game/match-status` - 比赛状态
- `POST /api/game/team-stats` - 团队统计

### 数据查询接口
- `GET /api/matches/` - 比赛列表
- `GET /api/matches/{match_id}` - 比赛详情
- `GET /api/matches/{match_id}/events` - 比赛事件
- `GET /api/matches/{match_id}/leaderboard` - 排行榜
- `GET /api/matches/{match_id}/status` - 比赛状态

### WebSocket连接
- `WS /ws/live/{match_id}` - 实时直播连接

## 项目结构
```
├── start.sh              # Linux/macOS启动脚本
├── start.bat             # Windows启动脚本
├── main.py               # 主启动文件
├── mc_live.db           # SQLite数据库（自动生成）
├── requirements.txt      # Python依赖
├── .env                 # 环境配置
├── app/
│   ├── core/
│   │   └── database.py    # SQLite数据库配置
│   ├── models/
│   │   └── models.py      # 数据模型
│   ├── schemas/
│   │   └── schemas.py     # Pydantic模型
│   ├── api/
│   │   ├── game.py        # 游戏数据API
│   │   ├── matches.py     # 比赛数据API
│   │   └── websocket.py   # WebSocket API
│   └── services/
│       └── websocket_manager.py # WebSocket管理
└── frontend/              # NextJS前端代码
    ├── src/
    │   ├── app/           # Next.js App Router
    │   ├── components/    # React组件
    │   ├── store/         # Zustand状态管理
    │   ├── utils/         # 工具函数
    │   └── styles/        # 样式文件
    ├── package.json
    └── next.config.js
```

## 核心功能

### 🎮 实时数据接收
- 游戏服务器通过POST接口推送数据
- 支持事件、分数、排行榜、状态、团队数据
- 使用JSONB存储灵活的游戏数据

### 📡 WebSocket实时推送
- 双向通信支持
- 自动重连机制
- 心跳保活
- 用户评论实时同步

### 🖥️ 直播界面
- **文字直播模式**: 实时事件流、玩家数据、排行榜
- **视频直播模式**: B站视频集成、简化数据面板
- 一键切换直播模式

### 💬 用户交互
- 实时聊天评论
- 昵称设置和管理
- 消息历史记录

### 📊 数据展示
- 实时排行榜（支持排名动画）
- 玩家详细数据面板
- 比赛状态和倒计时
- 团队统计数据

## API使用示例

### 发送游戏事件
```bash
curl -X POST http://localhost:8000/api/game/events \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "test_match_1",
    "event_type": "player_kill",
    "player": "player1",
    "target": "player2",
    "data": {"weapon": "sword", "location": {"x": 100, "y": 64, "z": 200}}
  }'
```

### 更新玩家分数
```bash
curl -X POST http://localhost:8000/api/game/player-scores \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "test_match_1",
    "players": [
      {
        "player_name": "player1",
        "score": 150,
        "level": 3,
        "health": 80,
        "experience": 1200
      }
    ]
  }'
```

## 故障排除

### 端口占用
```bash
# 查看端口占用
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### 依赖安装失败
```bash
# 升级pip
pip install --upgrade pip

# 清除npm缓存
npm cache clean --force
```

### 手动启动
如果脚本无法使用：
```bash
# 1. 安装依赖
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 2. 构建前端
cd frontend && npm run build && cd ..

# 3. 启动服务器
python main.py
```

## 部署说明

### 生产环境部署
1. 运行: `./start.sh`
2. 配置反向代理（Nginx）支持WebSocket
3. 设置环境变量和SSL证书

### Docker部署
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

## 数据库说明

使用SQLite数据库，具有以下优势：
- 📁 文件数据库，无需安装服务
- 🚀 零配置，开箱即用
- 💾 自动备份和迁移
- 🔒 ACID事务支持

### 数据库表结构
- `matches` - 比赛基本信息
- `game_events` - 实时游戏事件
- `player_scores` - 玩家分数数据
- `match_leaderboard` - 排行榜数据
- `team_stats` - 团队统计
- `match_status` - 比赛状态
- `comments` - 用户评论

## 注意事项

- ✅ SQLite数据库自动创建，无需手动配置
- ✅ WebSocket支持自动重连
- ✅ 生产环境建议使用HTTPS/WSS
- ✅ 支持跨平台部署（Linux/macOS/Windows）

## 许可证
MIT License

## API接口文档

### 游戏数据接收接口
- `POST /api/game/events` - 实时游戏事件
- `POST /api/game/player-scores` - 玩家分数更新
- `POST /api/game/match-leaderboard` - 比赛排行榜
- `POST /api/game/match-status` - 比赛状态
- `POST /api/game/team-stats` - 团队统计

### 数据查询接口
- `GET /api/matches/` - 比赛列表
- `GET /api/matches/{match_id}` - 比赛详情
- `GET /api/matches/{match_id}/events` - 比赛事件
- `GET /api/matches/{match_id}/leaderboard` - 排行榜
- `GET /api/matches/{match_id}/status` - 比赛状态

### WebSocket连接
- `WS /ws/live/{match_id}` - 实时直播连接

## 项目结构
```
├── main.py                 # 主启动文件
├── requirements.txt        # Python依赖
├── .env.example           # 环境变量模板
├── app/
│   ├── core/
│   │   └── database.py    # 数据库配置
│   ├── models/
│   │   └── models.py      # 数据模型
│   ├── schemas/
│   │   └── schemas.py     # Pydantic模型
│   ├── api/
│   │   ├── game.py        # 游戏数据API
│   │   ├── matches.py     # 比赛数据API
│   │   └── websocket.py   # WebSocket API
│   └── services/
│       └── websocket_manager.py # WebSocket管理
└── frontend/              # NextJS前端代码
    ├── src/
    │   ├── app/           # Next.js App Router
    │   ├── components/    # React组件
    │   ├── store/         # Zustand状态管理
    │   ├── utils/         # 工具函数
    │   └── styles/        # 样式文件
    ├── package.json
    └── next.config.js
```

## 核心功能

### 🎮 实时数据接收
- 游戏服务器通过POST接口推送数据
- 支持事件、分数、排行榜、状态、团队数据
- 使用JSONB存储灵活的游戏数据

### 📡 WebSocket实时推送
- 双向通信支持
- 自动重连机制
- 心跳保活
- 用户评论实时同步

### 🖥️ 直播界面
- **文字直播模式**: 实时事件流、玩家数据、排行榜
- **视频直播模式**: B站视频集成、简化数据面板
- 一键切换直播模式

### 💬 用户交互
- 实时聊天评论
- 昵称设置和管理
- 消息历史记录

### 📊 数据展示
- 实时排行榜（支持排名动画）
- 玩家详细数据面板
- 比赛状态和倒计时
- 团队统计数据

## 开发说明

### 数据库表结构
- `matches` - 比赛基本信息
- `game_events` - 实时游戏事件
- `player_scores` - 玩家分数数据
- `match_leaderboard` - 排行榜数据
- `team_stats` - 团队统计
- `match_status` - 比赛状态
- `comments` - 用户评论

### 前端组件
- `LiveEventFeed` - 实时事件流
- `LeaderboardPanel` - 排行榜面板
- `PlayerDetailsPanel` - 玩家数据面板
- `ChatSection` - 聊天评论组件
- `StreamToggle` - 直播模式切换

### 状态管理
使用Zustand管理全局状态：
- 连接状态和比赛信息
- 实时数据（事件、分数、排行榜等）
- 用户界面状态

## 部署说明

### 生产环境部署
1. 构建前端: `cd frontend && npm run build`
2. 配置环境变量（数据库连接等）
3. 启动后端: `python main.py`
4. 配置反向代理（Nginx）支持WebSocket

### Docker部署
```dockerfile
# 示例Dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

## API使用示例

### 发送游戏事件
```bash
curl -X POST http://localhost:8000/api/game/events \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "test_match_1",
    "event_type": "player_kill",
    "player": "player1",
    "target": "player2",
    "data": {"weapon": "sword", "location": {"x": 100, "y": 64, "z": 200}}
  }'
```

### 更新玩家分数
```bash
curl -X POST http://localhost:8000/api/game/player-scores \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "test_match_1",
    "players": [
      {
        "player_name": "player1",
        "score": 150,
        "level": 3,
        "health": 80,
        "experience": 1200
      }
    ]
  }'
```

## 注意事项

- 确保PostgreSQL数据库运行正常
- WebSocket连接需要支持WebSocket的代理配置
- 生产环境建议使用HTTPS/WSS
- 定期清理历史数据以优化性能

## 许可证
MIT License