# S2CC锦标赛实时数据看板

这是一个基于Next.js构建的实时锦标赛数据看板，通过WebSocket连接到后端实时接收比赛数据并展示。

## 功能特性

- 🔗 **实时WebSocket连接** - 自动连接并保持与后端的实时通信
- 📊 **动态积分榜** - 显示全局和当前游戏的实时积分排名
- 🎮 **游戏事件流** - 实时显示比赛中发生的各种事件
- 🗳️ **投票系统** - 展示游戏选择投票的实时结果
- 📱 **响应式设计** - 支持桌面和移动设备
- 💫 **自动重连** - 连接断开时自动重新连接

## 快速开始

### 安装依赖
```bash
cd cc-live-frontend
npm install
```

### 开发模式
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建
```bash
npm run build
npm start
```

## 技术栈

- **前端框架**: Next.js 15 (React 19)
- **样式**: Tailwind CSS 4
- **类型检查**: TypeScript
- **实时通信**: WebSocket
- **代码检査**: ESLint

## 组件结构

```
src/
├── app/
│   ├── page.tsx              # 主页面
│   ├── layout.tsx            # 应用布局
│   └── globals.css           # 全局样式
├── components/
│   ├── Leaderboard.tsx       # 积分榜组件
│   ├── GameEventDisplay.tsx  # 游戏事件显示
│   ├── VotingDisplay.tsx     # 投票显示
│   ├── ConnectionIndicator.tsx # 连接状态指示器
│   ├── GameStatusDisplay.tsx # 游戏状态显示
│   └── GameScoreCard.tsx     # 游戏分数卡片
├── hooks/
│   └── useWebSocket.ts       # WebSocket钩子
└── types/
    └── tournament.ts         # 类型定义
```

## WebSocket连接

应用会自动连接到生产环境 `wss://live-cc-api.lynn6.top/ws` 或开发环境 `ws://localhost:8000/ws`。

### 支持的消息类型

- `game_event` - 游戏事件（含积分预测）
- `global_score_update` - 全局积分更新
- `vote_event` - 投票事件
- `global_event` - 游戏状态变化
- `game_round_change` - 游戏回合变更

## 支持的队伍

系统支持16支队伍：
- 白队 (WHITE)
- 橙队 (ORANGE)  
- 品红队 (MAGENTA)
- 淡蓝队 (LIGHT_BLUE)
- 黄队 (YELLOW)
- 黄绿队 (LIME)
- 粉红队 (PINK)
- 灰队 (GRAY)
- 淡灰队 (LIGHT_GRAY)
- 青队 (CYAN)
- 紫队 (PURPLE)
- 蓝队 (BLUE)
- 棕队 (BROWN)
- 绿队 (GREEN)
- 红队 (RED)
- 黑队 (BLACK)

## 支持的游戏

- 宾果时速 (bingo)
- 跑酷追击 (parkour_chase)
- 斗战方框 (battle_box)
- TNT飞跃 (tntrun)
- 空岛乱斗 (skywars)
- 烫手鳕鱼 (hot_cod)
- 跑路战士 (runaway_warrior)
- 躲避箭 (dodging_bolt) - 最终对决

## 开发指南

### 添加新组件
1. 在 `src/components/` 目录下创建新组件
2. 使用TypeScript和Tailwind CSS
3. 确保组件是响应式的
4. 导入并在主页面中使用

### 修改样式
项目使用Tailwind CSS，可以直接在组件中使用Tailwind类名。全局样式定义在 `src/app/globals.css` 中。

### WebSocket数据处理
WebSocket相关逻辑集中在 `src/hooks/useWebSocket.ts` 中。如需添加新的消息类型处理，请：
1. 更新 `src/types/tournament.ts` 中的类型定义
2. 在 `useWebSocket` 钩子中添加相应的消息处理逻辑

## 故障排除

### WebSocket连接失败
- 确保后端WebSocket服务运行在 `wss://live-cc-api.lynn6.top/ws` (生产环境) 或 `ws://localhost:8000/ws` (开发环境)
- 检查网络连接和防火墙设置
- 查看浏览器控制台的错误信息

### 样式问题
- 确保Tailwind CSS正确安装和配置
- 检查 `tailwind.config.ts` 配置文件
- 清除浏览器缓存并重新加载

### 构建错误
- 运行 `npm run lint` 检查代码规范
- 检查TypeScript类型错误
- 确保所有依赖正确安装
