# Bingo卡片功能实现

## 🎯 功能概述

为S2CC锦标赛前端添加了完整的Bingo卡片显示功能，支持：

- **队伍卡片显示**：包含队伍信息、成员列表、完成进度
- **共享卡片显示**：不包含队伍信息的通用卡片
- **任务详情弹窗**：点击任务查看详细信息
- **坐标系统**：每个任务包含x,y坐标和索引信息
- **实时更新**：通过WebSocket接收卡片数据更新

## 📋 数据结构

### BingoTask (任务)
```typescript
interface BingoTask {
  index: number;           // 任务在数组中的索引
  x: number;              // x坐标 (列)
  y: number;              // y坐标 (行)
  name: string;           // 任务名称
  type: string;           // 任务类型 (ITEM, ADVANCEMENT, STATISTIC等)
  description: string;    // 任务描述
  material?: string;      // 物品类型 (如果是物品任务)
  count?: number;         // 需要数量 (如果有数量要求)
  completed?: boolean;    // 是否完成
  completedBy?: string;   // 完成者
  completedAt?: number;   // 完成时间戳
}
```

### BingoCard (卡片)
```typescript
interface BingoCard {
  size: number;           // 总任务数 (如25)
  width: number;          // 宽度 (如5)
  height: number;         // 高度 (如5)
  team?: BingoTeamInfo;   // 队伍信息 (队伍卡片才有，共享卡片为空)
  tasks: Record<string, BingoTask>; // 任务映射，键为"x,y"格式
  timestamp: number;      // 更新时间戳
}
```

### BingoTeamInfo (队伍信息)
```typescript
interface BingoTeamInfo {
  name: string;           // 队伍名称
  color: string;          // 队伍颜色
  completeCount: number;  // 已完成任务数
  outOfTheGame: boolean;  // 是否出局
  members: Record<string, {
    name: string;         // 玩家名
    displayName: string;  // 显示名
    alwaysActive: boolean; // 是否常驻活跃
  }>;
}
```

## 🎨 UI组件

### 1. BingoCardComponent
主要的Bingo卡片显示组件，功能包括：
- 5x5或其他尺寸的网格布局
- 任务图标和名称显示
- 完成状态指示器
- 数量指示器
- 坐标显示
- 进度条 (队伍卡片)
- 队伍信息显示
- 点击任务打开详情弹窗

### 2. BingoTaskModal
任务详情弹窗组件，显示：
- 任务类型图标
- 任务名称和描述
- 位置信息 (坐标、索引、顺序)
- 任务要求 (物品类型、数量)
- 完成状态
- 完成者和完成时间

### 3. BingoDisplay
游戏显示组件，集成到GameDisplay中：
- 优先显示Bingo卡片 (如果有数据)
- 回退到传统排行榜显示
- 等待数据时的加载状态

## 🔌 数据流

1. **WebSocket接收**：后端通过WebSocket发送`bingoCard`数据
2. **状态管理**：`useWebSocket` hook更新`TournamentData.bingoCard`
3. **组件传递**：主页面将数据传递给GameDisplay
4. **渲染显示**：BingoDisplay根据游戏类型选择渲染方式
5. **交互反馈**：点击任务打开详情弹窗

## 🎯 坐标系统

```
5x5卡片坐标示例：
(0,0) (1,0) (2,0) (3,0) (4,0)
(0,1) (1,1) (2,1) (3,1) (4,1)
(0,2) (1,2) (2,2) (3,2) (4,2)
(0,3) (1,3) (2,3) (3,3) (4,3)
(0,4) (1,4) (2,4) (3,4) (4,4)
```

- **x坐标**: `index % width` (列，从0开始)
- **y坐标**: `Math.floor(index / width)` (行，从0开始)
- **任务键**: 使用`"x,y"`格式作为tasks对象的键

## 🎨 样式特性

- **响应式设计**：自适应不同屏幕尺寸
- **悬停效果**：任务卡片hover时放大
- **状态指示**：
  - 绿色：已完成任务
  - 灰色：未完成任务
  - 蓝色圆点：数量指示器
  - 绿色对勾：完成标记
- **队伍主题色**：卡片头部使用队伍颜色
- **玻璃拟态**：现代化的半透明背景效果

## 🚀 使用方式

1. **后端数据**：确保后端发送符合`BingoCard`格式的数据
2. **WebSocket**：数据通过`full_data_update`消息类型发送
3. **游戏检测**：当`gameStatus.game.name === 'bingo'`时自动显示
4. **实时更新**：任务完成状态会实时更新

## 🔧 技术实现

- **TypeScript**：完全类型安全
- **React Hooks**：现代化状态管理
- **Tailwind CSS**：实用优先的样式系统
- **WebSocket**：实时数据通信
- **组件化设计**：可复用的模块化组件

## 📱 交互体验

- **直观布局**：清晰的网格结构
- **即时反馈**：点击任务立即显示详情
- **状态清晰**：完成/未完成状态一目了然
- **信息丰富**：详情弹窗包含完整任务信息
- **无障碍设计**：语义化HTML和ARIA属性

这个实现为S2CC锦标赛的Bingo游戏提供了完整的前端显示支持，用户可以清楚地看到卡片布局、任务详情和完成进度。
