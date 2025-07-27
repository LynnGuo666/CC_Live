# MC小游戏比赛在线直播系统 - 快速启动指南

## 🚀 一键启动

### Linux/macOS
```bash
./start.sh
```

### Windows
```cmd
start.bat
```

## 📋 启动选项

### 完整启动（默认）
```bash
./start.sh
```
- 自动检查环境
- 安装所有依赖
- 构建前端应用
- 启动服务器

### 开发模式
```bash
./start.sh --dev
```
- 跳过前端构建
- 快速启动开发服务器

### 跳过依赖安装
```bash
./start.sh --skip-deps
```
- 适用于依赖已安装的情况

### 跳过前端构建
```bash
./start.sh --skip-build
```
- 使用现有构建文件启动

### 显示帮助
```bash
./start.sh --help
```

## 📝 手动启动步骤

如果自动脚本无法使用，可以手动执行以下步骤：

### 1. 安装依赖
```bash
# Python依赖
pip install -r requirements.txt

# 前端依赖
cd frontend
npm install
cd ..
```

### 2. 构建前端（生产模式）
```bash
cd frontend
npm run build
cd ..
```

### 3. 启动服务器
```bash
python main.py
```

## 🔧 环境要求

- **Python**: 3.8+
- **Node.js**: 18+
- **npm**: 8+

## 🗄️ 数据库说明

项目使用SQLite数据库，无需额外安装：
- 数据库文件：`mc_live.db`
- 自动创建表结构
- 支持并发读写

## 🌐 访问地址

启动成功后访问：
- **主页面**: http://localhost:8000
- **API文档**: http://localhost:8000/api/docs
- **WebSocket**: ws://localhost:8000/ws/live/{match_id}

## 🛠️ 故障排除

### 端口占用
```bash
# 查看端口占用
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# 停止占用进程
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### 依赖安装失败
```bash
# 升级pip
pip install --upgrade pip

# 清除npm缓存
npm cache clean --force
```

### 权限问题
```bash
# Linux/macOS 添加执行权限
chmod +x start.sh
```

## 📚 项目结构

```
├── start.sh              # Linux/macOS启动脚本
├── start.bat             # Windows启动脚本
├── main.py               # 应用入口
├── mc_live.db           # SQLite数据库（运行后生成）
├── .env                 # 环境配置
├── requirements.txt     # Python依赖
├── app/                 # 后端代码
└── frontend/           # 前端代码
    ├── src/
    ├── out/            # 构建输出（npm run build后生成）
    └── package.json
```