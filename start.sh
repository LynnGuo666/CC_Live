#!/bin/bash

# MC小游戏比赛在线直播系统 - 全自动启动脚本
# 作者: Claude Code
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 输出函数
print_step() {
    echo -e "${BLUE}[步骤]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[信息]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║        🎮 MC小游戏比赛在线直播系统 🎮                        ║"
    echo "║                                                              ║"
    echo "║     FastAPI + Next.js + SQLite + WebSocket                  ║"
    echo "║                                                              ║"
    echo "║     作者: Claude Code                                        ║"
    echo "║     版本: 1.0.0                                              ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查系统环境
check_system() {
    print_step "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "检测到 macOS 系统"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "检测到 Linux 系统"
    else
        print_warning "未知操作系统，继续执行..."
    fi
    
    # 检查Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python 已安装: $PYTHON_VERSION"
    else
        print_error "Python3 未安装，请先安装 Python 3.8+"
        exit 1
    fi
    
    # 检查Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js 已安装: $NODE_VERSION"
    else
        print_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    # 检查npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm 已安装: $NPM_VERSION"
    else
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
}

# 安装Python依赖
install_python_deps() {
    print_step "安装Python依赖..."
    
    # 检查虚拟环境
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        print_info "检测到虚拟环境: $VIRTUAL_ENV"
    else
        print_warning "未检测到虚拟环境，建议使用虚拟环境"
        read -p "是否创建虚拟环境? (y/N): " create_venv
        if [[ $create_venv =~ ^[Yy]$ ]]; then
            print_step "创建虚拟环境..."
            python3 -m venv venv
            source venv/bin/activate
            print_success "虚拟环境已创建并激活"
        fi
    fi
    
    # 安装依赖
    if [[ -f "requirements.txt" ]]; then
        pip install -r requirements.txt
        print_success "Python依赖安装完成"
    else
        print_error "requirements.txt 文件未找到"
        exit 1
    fi
}

# 安装前端依赖
install_frontend_deps() {
    print_step "安装前端依赖..."
    
    if [[ -d "frontend" ]]; then
        cd frontend
        if [[ -f "package.json" ]]; then
            npm install
            print_success "前端依赖安装完成"
            cd ..
        else
            print_error "frontend/package.json 文件未找到"
            exit 1
        fi
    else
        print_error "frontend 目录未找到"
        exit 1
    fi
}

# 构建前端
build_frontend() {
    print_step "构建前端应用..."
    
    cd frontend
    npm run build
    if [[ -d "out" ]]; then
        print_success "前端构建完成，输出目录: frontend/out"
    else
        print_error "前端构建失败，未找到输出目录"
        exit 1
    fi
    cd ..
}

# 初始化环境配置
init_config() {
    print_step "初始化环境配置..."
    
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            print_success "已创建 .env 配置文件"
        else
            print_warning "未找到 .env.example 文件，创建默认配置"
            cat > .env << EOF
# SQLite数据库文件名
DATABASE_FILE=mc_live.db

# 调试模式
DEBUG=True

# 服务器配置
HOST=0.0.0.0
PORT=8000
EOF
        fi
    else
        print_info ".env 配置文件已存在"
    fi
}

# 启动应用
start_application() {
    print_step "启动应用服务..."
    
    # 检查端口是否被占用
    PORT=${PORT:-8000}
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "端口 $PORT 已被占用"
        read -p "是否强制停止占用端口的进程? (y/N): " kill_process
        if [[ $kill_process =~ ^[Yy]$ ]]; then
            lsof -ti:$PORT | xargs kill -9
            print_info "已停止占用端口的进程"
        else
            print_error "请手动停止占用端口的进程或修改端口配置"
            exit 1
        fi
    fi
    
    print_info "正在启动服务器..."
    print_info "访问地址: http://localhost:$PORT"
    print_info "API文档: http://localhost:$PORT/api/docs"
    print_info ""
    print_info "按 Ctrl+C 停止服务"
    print_info ""
    
    # 启动FastAPI服务器
    python3 main.py
}

# 清理函数
cleanup() {
    print_info "正在停止服务..."
    # 这里可以添加清理逻辑
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    show_banner
    
    # 检查是否在项目根目录
    if [[ ! -f "main.py" ]]; then
        print_error "请在项目根目录执行此脚本"
        exit 1
    fi
    
    # 解析命令行参数
    SKIP_DEPS=false
    SKIP_BUILD=false
    DEV_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --skip-deps    跳过依赖安装"
                echo "  --skip-build   跳过前端构建"
                echo "  --dev          开发模式（跳过构建）"
                echo "  --help, -h     显示帮助信息"
                echo ""
                exit 0
                ;;
            *)
                print_warning "未知参数: $1"
                shift
                ;;
        esac
    done
    
    # 执行步骤
    check_system
    init_config
    
    if [[ "$SKIP_DEPS" == false ]]; then
        install_python_deps
        install_frontend_deps
    else
        print_info "跳过依赖安装"
    fi
    
    if [[ "$DEV_MODE" == true ]]; then
        print_info "开发模式：跳过前端构建"
    elif [[ "$SKIP_BUILD" == false ]]; then
        build_frontend
    else
        print_info "跳过前端构建"
    fi
    
    start_application
}

# 运行主函数
main "$@"