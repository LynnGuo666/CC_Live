# WebSocket 消息格式文档

## 连接信息

**WebSocket端点**: `ws://localhost:8000/ws`
**可选参数**: `?client_id=your_client_id`

## 消息类型

### 1. 连接相关消息

#### 连接成功
```json
{
  "type": "connection",
  "status": "connected",
  "message": "连接成功",
  "client_id": "client_123",
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 心跳响应
```json
{
  "type": "pong",
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 状态查询响应
```json
{
  "type": "status_response",
  "connection_count": 10,
  "client_info": {
    "client_id": "client_123",
    "connected_at": "2024-01-01T12:00:00",
    "last_ping": "2024-01-01T12:00:00"
  }
}
```

### 2. 游戏事件消息

#### 游戏事件 (含分数预测)
```json
{
  "type": "game_event",
  "game_id": "bingo",
  "data": {
    "player": "Player1",
    "team": "RED",
    "event": "Item_Found",
    "lore": "diamond"
  },
  "score_prediction": {
    "game_id": "bingo",
    "round": 1,
    "timestamp": "2024-01-01T12:00:00",
    "team_rankings": [
      {
        "team_id": "RED",
        "rank": 1,
        "total_score": 120,
        "players": {
          "Player1": 80,
          "Player2": 40
        }
      },
      {
        "team_id": "BLUE",
        "rank": 2,
        "total_score": 60,
        "players": {
          "Player3": 30,
          "Player4": 30
        }
      }
    ],
    "total_events_processed": 5
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 游戏分数更新
```json
{
  "type": "game_score_update",
  "game_id": "skywars",
  "data": {
    "total_updates": 2,
    "scores": [
      {
        "player": "Player1",
        "team": "RED",
        "score": 10
      },
      {
        "player": "Player2",
        "team": "BLUE",
        "score": 5
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 游戏回合变更
```json
{
  "type": "game_round_change",
  "game_id": "battle_box",
  "round": 2,
  "timestamp": "2024-01-01T12:00:00"
}
```

### 3. 全局事件消息

#### 全局分数更新
```json
{
  "type": "global_score_update",
  "data": {
    "total_teams": 3,
    "team_scores": [
      {
        "team": "RED",
        "total_score": 500,
        "player_count": 2,
        "scores": [
          {
            "player": "Player1",
            "score": 300
          },
          {
            "player": "Player2",
            "score": 200
          }
        ]
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 全局游戏状态事件
```json
{
  "type": "global_event",
  "data": {
    "status": "gaming",
    "game": {
      "name": "宾果时速",
      "round": 1
    }
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 投票事件
```json
{
  "type": "vote_event",
  "data": {
    "time_remaining": 60,
    "total_games": 3,
    "total_tickets": 150,
    "votes": [
      {
        "game": "bingo",
        "ticket": 80
      },
      {
        "game": "parkour_chase",
        "ticket": 45
      },
      {
        "game": "battle_box",
        "ticket": 25
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

## 分数预测详情

### team_rankings 数组结构
每个团队对象包含：
- `team_id`: 队伍ID (如: "RED", "BLUE")
- `rank`: 当前排名 (1为第一名)
- `total_score`: 队伍总积分
- `players`: 队伍内玩家积分映射 `{player_name: score}`

### 支持的游戏类型
1. **bingo** - 宾果时速
2. **parkour_chase** - 跑酷追击
3. **battle_box** - 斗战方框
4. **tntrun** - TNT飞跃
5. **skywars** - 空岛乱斗
6. **hot_cod** - 烫手鳕鱼
7. **runaway_warrior** - 跑路战士
8. **dodging_bolt** - 躲避箭 (最终对决)

### 客户端示例代码

```javascript
const ws = new WebSocket('ws://localhost:8000/ws?client_id=viewer1');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
    
    switch(data.type) {
        case 'game_event':
            // 处理游戏事件和分数预测
            updateLeaderboard(data.score_prediction);
            showGameEvent(data.data);
            break;
            
        case 'global_score_update':
            // 处理全局分数更新
            updateGlobalScoreboard(data.data);
            break;
            
        case 'vote_event':
            // 处理投票事件
            updateVotingDisplay(data.data);
            break;
            
        case 'global_event':
            // 处理游戏状态变化
            updateGameStatus(data.data);
            break;
    }
};

// 发送心跳包
setInterval(() => {
    ws.send(JSON.stringify({type: 'ping'}));
}, 30000);

// 查询状态
function getStatus() {
    ws.send(JSON.stringify({type: 'status'}));
}
```

## API端点

### 获取当前分数榜
`GET /api/{game_id}/leaderboard`

返回当前游戏的实时分数榜，格式与WebSocket中的`score_prediction`相同。

### 设置游戏回合
`POST /api/{game_id}/set_round`
```json
{
  "round": 2
}
```

### WebSocket连接统计
`GET /ws/stats`

返回当前WebSocket连接统计信息。