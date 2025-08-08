# CC Live - S2CC锦标赛系统

一个完整的实时锦标赛管理系统，包含FastAPI后端和Next.js前端，支持WebSocket实时数据传输、游戏事件处理、分数计算和前端展示。

## 项目结构

```
CC_Live/
├── app/                    # 后端应用模块
│   ├── api/               # API路由
│   │   ├── game_routes.py      # 游戏相关API
│   │   ├── global_routes.py    # 全局API
│   │   └── websocket_routes.py # WebSocket路由
│   ├── core/              # 核心业务逻辑
│   │   ├── config.py           # 配置管理
│   │   ├── data_manager.py     # 数据管理
│   │   ├── game_config.py      # 游戏配置
│   │   ├── score_engine.py     # 积分引擎
│   │   ├── tournament_manager.py # 锦标赛管理
│   │   └── websocket.py        # WebSocket管理
│   └── models/            # 数据模型
│       └── models.py           # Pydantic模型定义
├── cc-live-frontend/      # 前端应用
│   ├── src/
│   │   ├── app/               # Next.js应用
│   │   ├── components/        # React组件
│   │   ├── hooks/            # 自定义Hooks
│   │   └── types/            # TypeScript类型
│   └── package.json          # 前端依赖
├── main.py               # 后端应用入口
├── requirements.txt      # 后端依赖包
├── tournament_config.yml # 锦标赛配置文件
└── README.md            # 项目说明文档
```

## 功能特性

### 后端功能
- ✅ 完全模块化设计
- ✅ WebSocket实时通信
- ✅ 智能积分计算引擎
- ✅ 多游戏类型支持
- ✅ 完整的API文档（Swagger UI）
- ✅ 错误处理和异常管理
- ✅ CORS支持
- ✅ 健康检查端点
- ✅ 类型验证（Pydantic）

### 前端功能
- ✅ 实时WebSocket连接
- ✅ 动态积分榜显示
- ✅ 游戏事件实时流
- ✅ 投票系统展示
- ✅ 响应式设计
- ✅ 自动重连机制
- ✅ TypeScript类型安全

## 技术栈

### 后端技术
- **框架**: FastAPI 0.104.1+
- **ASGI服务器**: Uvicorn
- **数据验证**: Pydantic 2.5.0+
- **配置管理**: PyYAML 6.0+
- **实时通信**: WebSockets 12.0+
- **API文档**: Swagger UI / ReDoc

### 前端技术
- **框架**: Next.js 15.4.4 (React 19)
- **样式**: Tailwind CSS 4
- **类型检查**: TypeScript 5+
- **代码规范**: ESLint 9+
- **实时通信**: WebSocket API

### 开发工具
- **包管理**: npm (前端) / pip (后端)
- **构建工具**: Turbopack (Next.js)
- **开发环境**: Node.js 20+ / Python 3.8+

## API端点

### 1. 游戏事件
- **POST** `/api/{game_id}/event` - 处理特定游戏的事件

### 2. 游戏分数更新  
- **POST** `/api/{game_id}/score` - 批量更新特定游戏中玩家的分数

### 3. 全局分数更新
- **POST** `/api/game/score` - 更新所有队伍的总分和玩家得分

### 4. 全局事件
- **POST** `/api/game/event` - 广播游戏的全局状态变更

### 5. 全局投票事件
- **POST** `/api/vote/event` - 推送游戏的投票数据

### 6. 系统端点
- **GET** `/` - 根路径，返回API基本信息
- **GET** `/health` - 健康检查端点
- **GET** `/docs` - Swagger UI API文档
- **GET** `/redoc` - ReDoc API文档

## 快速开始

### 后端启动

#### 1. 安装后端依赖
```bash
pip install -r requirements.txt
```

#### 2. 启动后端服务器
```bash
python main.py
```

后端服务器将在 `http://localhost:8000` 启动

### 前端启动

#### 1. 安装前端依赖
```bash
cd cc-live-frontend
npm install
```

#### 2. 启动前端开发服务器
```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

### API文档
访问 `http://localhost:8000/docs` 查看完整的Swagger UI文档

### WebSocket连接
前端会自动连接到 `wss://live-cc-api.lynn6.top/ws` (生产环境) 或 `ws://localhost:8000/ws` (开发环境)

### 测试
```bash
python test_api.py
```

## 数据模型

### GameEvent（游戏事件）
```json
{
  "player": "Venti_Lynn",
  "team": "BLACK", 
  "event": "Item_Found",
  "lore": "diamond"
}
```

### ScoreUpdate（分数更新）
```json
[
  {
    "player": "Venti_Lynn",
    "team": "BLACK",
    "score": 100
  }
]
```

### TeamScore（队伍分数）
```json
[
  {
    "team": "BLACK",
    "total_score": 500,
    "scores": [
      {
        "player": "Venti_Lynn", 
        "score": 200
      }
    ]
  }
]
```

### GlobalEvent（全局事件）
```json
{
  "status": "gaming",
  "game": {
    "name": "宾果时速",
    "round": 1
  }
}
```

### VoteEvent（投票事件）
```json
{
  "votes": [
    {
      "game": "宾果时速",
      "ticket": 25
    }
  ],
  "time": 60
}
```

## 支持的游戏类型

根据 `tournament_config.yml` 配置，支持以下游戏：

1. **宾果时速** (bingo) - 1局，10分钟
   - 在有限的时间里，尽可能多和快地收集宾果所要求的物品
   - 事件类型：Item_Found

2. **跑酷追击** (parkour_chase) - 8轮，8分钟
   - 在跑酷的竞技场中，抓住所有对手，或者尽可能在对手的追击下存活更长时间
   - 事件类型：Chaser_Selected, Player_Tagged, Round_Start, Round_Over

3. **斗战方框** (battle_box) - 8轮，8分钟
   - 在有限的空间内与对手决斗，击杀对手并通过填满场地中央的羊毛方框来取得胜利
   - 事件类型：Kill, Wool_Win, Round_Start, Round_Over

4. **TNT飞跃** (tntrun) - 3轮，9分钟
   - 踩中的方块会消失！尽量比其他玩家活得更久
   - 事件类型：Player_Fall, Round_Start, Round_Over

5. **空岛乱斗** (skywars) - 1轮，18分钟
   - 在天空中收集资源、搭建桥梁，在不断缩小的活动空域内尽可能长时间地存活并击杀对手
   - 事件类型：Kill, Fall, Border_Start, Border_End, Round_Start, Round_Over

6. **烫手鳕鱼** (hot_cod) - 3轮，12分钟
   - 新鲜出炉的烫手鳕鱼！在被烫到受不了之前将鳕鱼扔给其他人
   - 事件类型：Cod_Passed, Death, Round_Start, Round_Over

7. **跑路战士** (runaway_warrior) - 1轮，12.5分钟
   - SCC跑酷激情回归，等等......跑路？闯过一系列跑酷关卡，尝试抵达终点
   - 事件类型：Checkpoint, Player_Mistake, Player_Finish

8. **躲避箭** (dodging_bolt) - 5轮，15分钟
   - 最终对决：躲闪对手的射击，通过命中淘汰对手
   - 事件类型：Player_Eliminated, Round_Win, Tournament_End

## 锦标赛配置

### 基本信息
- **名称**: S2CC锦标赛
- **总时长**: 预估180分钟（3小时）
- **游戏数量**: 7个常规游戏 + 1个最终对决
- **队伍数量**: 12支队伍

### 积分权重系统
越晚的轮次积分权重越高：
- 第1轮：积分×1.0
- 第2轮：积分×1.5
- 第3轮：积分×1.5  
- 第4轮：积分×2.0
- 第5轮：积分×2.0
- 第6轮：积分×2.5
- 最终对决：特殊积分系统

### 参赛队伍
红队、橙队、蓝队、绿队、黄队、青队、紫队、白队、粉红队、棕队、淡蓝队、淡灰队


## 开发说明

### 添加新的API端点

1. 在 `models.py` 中定义新的数据模型
2. 在相应的路由文件中添加新的端点函数
3. 在 `main.py` 中注册路由
4. 更新测试脚本

### 错误处理

所有API端点都包含完整的错误处理：
- 数据验证错误：返回422状态码
- 服务器内部错误：返回500状态码  
- 详细的中文错误信息

### 日志记录

所有API调用都会在控制台输出详细的中文日志信息，便于调试和监控。

## 生产环境部署

1. 设置适当的CORS允许源
2. 启用HTTPS
3. 配置日志系统
4. 设置环境变量
5. 使用生产级WSGI服务器（如Gunicorn）

## 许可证

此项目仅用于CC Live锦标赛游戏系统。