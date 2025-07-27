"""
API端点测试脚本
用于测试所有API端点的功能是否正常
"""

import requests
import json

# 服务器基础URL
BASE_URL = "http://localhost:8000"

def test_game_event():
    """
    测试游戏事件API端点
    URL: /api/<id>/event
    """
    url = f"{BASE_URL}/api/bingo_speed/event"
    data = {
        "player": "Venti_Lynn",
        "team": "BLACK",
        "event": "Item_Found",
        "lore": "diamond"
    }
    try:
        response = requests.post(url, json=data)
        print(f"游戏事件API测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
    except Exception as e:
        print(f"游戏事件API测试失败: {e}")

def test_game_score():
    """
    测试游戏分数更新API端点
    URL: /api/<id>/score
    """
    url = f"{BASE_URL}/api/bingo_speed/score"
    data = [
        {
            "player": "Venti_Lynn",
            "team": "BLACK",
            "score": 100
        },
        {
            "player": "Player2",
            "team": "RED",
            "score": 80
        }
    ]
    try:
        response = requests.post(url, json=data)
        print(f"游戏分数API测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
    except Exception as e:
        print(f"游戏分数API测试失败: {e}")

def test_global_score():
    """
    测试全局分数更新API端点
    URL: /api/game/score
    """
    url = f"{BASE_URL}/api/game/score"
    data = [
        {
            "team": "BLACK",
            "total_score": 500,
            "scores": [
                {
                    "player": "Venti_Lynn",
                    "score": 200
                },
                {
                    "player": "Player2",
                    "score": 300
                }
            ]
        },
        {
            "team": "RED", 
            "total_score": 400,
            "scores": [
                {
                    "player": "Player3",
                    "score": 150
                },
                {
                    "player": "Player4",
                    "score": 250
                }
            ]
        }
    ]
    try:
        response = requests.post(url, json=data)
        print(f"全局分数API测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
    except Exception as e:
        print(f"全局分数API测试失败: {e}")

def test_global_event():
    """
    测试全局事件API端点
    URL: /api/game/event
    """
    url = f"{BASE_URL}/api/game/event"
    data = {
        "status": "gaming",
        "game": {
            "name": "宾果时速",
            "round": 1
        }
    }
    try:
        response = requests.post(url, json=data)
        print(f"全局事件API测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
    except Exception as e:
        print(f"全局事件API测试失败: {e}")

def test_vote_event():
    """
    测试投票事件API端点
    URL: /api/vote/event
    修复了原来的数据格式问题
    """
    url = f"{BASE_URL}/api/vote/event"
    # 修复数据格式：votes应该是一个列表，time是单独的字段
    data = {
        "votes": [
            {
                "game": "宾果时速",
                "ticket": 25
            },
            {
                "game": "跑酷追击",
                "ticket": 30
            }
        ],
        "time": 60
    }
    try:
        response = requests.post(url, json=data)
        print(f"投票事件API测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
    except Exception as e:
        print(f"投票事件API测试失败: {e}")

def test_health_endpoints():
    """
    测试健康检查端点
    """
    try:
        # 测试根路径
        response = requests.get(f"{BASE_URL}/")
        print(f"根路径测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
        
        # 测试健康检查
        response = requests.get(f"{BASE_URL}/health")
        print(f"健康检查测试: {response.status_code}")
        print(f"响应内容: {response.json()}")
        print("-" * 50)
        
    except Exception as e:
        print(f"健康检查API测试失败: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("开始测试所有API端点...")
    print("=" * 60)
    
    try:
        # 首先测试基础端点
        test_health_endpoints()
        
        # 测试游戏相关API
        test_game_event()
        test_game_score()
        
        # 测试全局API
        test_global_score()
        test_global_event()
        test_vote_event()
        
        print("=" * 60)
        print("所有API端点测试完成！")
        print("如果看到200状态码，说明API正常工作")
        print("访问 http://localhost:8000/docs 查看完整的API文档")
        print("=" * 60)
        
    except requests.ConnectionError:
        print("错误: 无法连接到服务器")
        print("请确保服务器正在 localhost:8000 端口运行")
        print("运行命令: python main.py")
    except Exception as e:
        print(f"测试过程中发生错误: {e}")