# CC Live 游戏API

一个完全模块化的FastAPI后端，用于处理游戏事件、分数更新和全局状态管理。

## 项目结构

```
CC_Live/
├── main.py              # 主应用程序入口
├── models.py            # 数据模型定义
├── game_routes.py       # 游戏相关API路由
├── global_routes.py     # 全局API路由
├── test_api.py          # API测试脚本
├── requirements.txt     # 依赖包列表
├── tournament_config.yml # 锦标赛配置文件
└── README.md           # 项目说明文档
```

## 功能特性

- ✅ 完全模块化设计
- ✅ 中文消息和注释
- ✅ 完整的API文档（Swagger UI）
- ✅ 错误处理和异常管理
- ✅ CORS支持
- ✅ 健康检查端点
- ✅ 类型验证（Pydantic）

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

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 启动服务器
```bash
python main.py
```

服务器将在 `http://localhost:8000` 启动

### 3. 查看API文档
访问 `http://localhost:8000/docs` 查看完整的Swagger UI文档

### 4. 测试API
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

1. **宾果时速** (bingo_speed) - Item_Found事件
2. **跑酷追击** (parkour_chase) - Chaser_Selected, Player_Tagged等事件
3. **斗战方框** (battle_box) - Kill, Wool_Win等事件
4. **TNT飞跃** (tnt_spleef) - Player_Fall事件
5. **空岛乱斗** (sky_brawl) - Kill, Fall, Border事件
6. **烫手鳕鱼** (hot_cod) - Cod_Passed, Death事件
7. **跑路战士** (runaway_warrior) - Checkpoint, Player_Finish事件
8. **躲避箭** (dodging_bolt) - 最终对决游戏

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