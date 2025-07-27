# Minecraft锦标赛直播服务器

一个专为Minecraft文字锦标赛设计的实时直播服务器，支持多种小游戏的事件追踪、实时分数计算和WebSocket通信。

## 功能特性

- **实时事件追踪**: 支持6种小游戏的详细事件记录
- **智能分数预测**: 基于游戏规则的实时分数预测系统
- **WebSocket通信**: 实时数据推送给前端界面
- **投票系统**: 支持游戏投票功能
- **积分榜管理**: 队伍和个人积分实时更新
- **API文档**: 完整的RESTful API接口

## 支持的游戏

1. **宾果时速** (Bingo But Fast) - 物品收集竞速
2. **跑酷追击** (Parkour Tag) - 追击与逃脱
3. **斗战方框** (Battle Box) - 团队战斗
4. **TNT飞跃** (TNT Spleef) - 生存竞技
5. **空岛乱斗** (Sky Brawl) - 资源收集与战斗
6. **烫手鳕鱼** (Hoty Cody Dusky) - 传递与生存
7. **跑路战士** (Runaway Warrior) - 跑酷挑战
8. **躲避箭** (Dodging Bolt) - 最终对决

## 快速开始

### 环境要求

- Python 3.8+
- SQLite
- Node.js 16+ (可选，用于前端)

### 安装依赖

```bash
pip install -r requirements.txt
```

### 启动服务器

**Linux/macOS:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

**手动启动:**
```bash
python main.py
```

### 服务地址

- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws/live

## API接口说明

### 游戏事件接口

#### 推送游戏事件
```
POST /api/{game_id}/event
```

**请求体:**
```json
{
  "player": "Venti_Lynn",
  "team": "RED",
  "event": "Item_Found",
  "lore": "diamond"
}
```

#### 更新游戏分数
```
POST /api/{game_id}/score
```

**请求体:**
```json
[
  {
    "player": "Venti_Lynn",
    "team": "RED",
    "score": 50
  }
]
```

#### 初始化游戏
```
POST /api/{game_id}/initialize
```

**请求体:**
```json
{
  "teams": ["RED", "BLUE", "GREEN", "YELLOW"],
  "players": {
    "RED": ["Player1", "Player2"],
    "BLUE": ["Player3", "Player4"]
  }
}
```

### 全局接口

#### 更新全局分数
```
POST /api/game/score
```

#### 推送全局事件
```
POST /api/game/event
```

#### 推送投票事件
```
POST /api/vote/event
```

### 查询接口

#### 获取锦标赛信息
```
GET /api/tournament
```

#### 获取积分榜
```
GET /api/leaderboard
```

#### 获取游戏事件
```
GET /api/game/{game_id}/events
```

## 测试与模拟

使用内置的比赛模拟器测试系统功能：

```bash
python simulate_match.py
```

模拟器会自动：
- 初始化各种游戏
- 发送模拟的游戏事件
- 更新分数
- 测试实时分数预测

## 配置文件

### tournament_config.yml

配置文件包含了完整的游戏规则、积分计算和事件类型定义：

- 游戏详细信息和时长
- 积分规则和计算方式
- 事件类型和描述
- 队伍和玩家配置

## 实时分数预测

系统具备智能分数预测功能：

1. **事件驱动**: 基于游戏事件实时计算预测分数
2. **规则引擎**: 根据配置文件中的积分规则计算
3. **对比分析**: 预测分数与实际分数的对比
4. **实时广播**: 通过WebSocket实时推送预测结果

### 分数预测特性

- **宾果时速**: 基于物品发现顺序预测队伍和个人积分
- **跑酷追击**: 计算存活时间和追击积分
- **斗战方框**: 击杀和胜利积分预测
- **TNT飞跃**: 生存顺序积分计算
- **空岛乱斗**: 击杀、生存和团队淘汰积分
- **烫手鳕鱼**: 生存时间和位置积分
- **跑路战士**: 检查点和完成路线积分
- **躲避箭**: 淘汰和回合胜利积分

## WebSocket事件类型

客户端可以监听以下WebSocket事件：

- `game_event`: 游戏事件和分数预测
- `score_update`: 分数更新和对比
- `global_event`: 全局状态变更
- `vote_event`: 投票结果更新
- `viewer_count`: 在线观看人数

## 项目结构

```
CC_Live/
├── app/
│   ├── api/          # API路由
│   ├── core/         # 核心功能(数据库、配置)
│   ├── services/     # 服务层(WebSocket、分数预测)
│   └── schemas/      # 数据模型
├── tournament_config.yml  # 锦标赛配置
├── main.py          # 应用入口
├── simulate_match.py # 比赛模拟器
├── start.sh         # Linux/macOS启动脚本
└── start.bat        # Windows启动脚本
```

## 开发说明

### 添加新游戏

1. 在 `tournament_config.yml` 中添加游戏配置
2. 在 `scoring` 部分定义积分规则
3. 在 `event_types` 中定义事件类型
4. 在 `score_prediction.py` 中实现分数预测逻辑

### 自定义积分规则

修改 `tournament_config.yml` 中的 `scoring` 部分，系统会自动应用新的积分规则。

## 注意事项

- 所有分数以POST接口上传的数据为准
- 分数预测仅用于实时显示，不影响最终结果
- WebSocket连接支持多客户端同时连接
- 数据库文件 `tournament.db` 会自动创建

## 许可证

本项目采用MIT许可证。