import requests
import json

BASE_URL = "http://localhost:8000"

def test_game_event():
    """测试游戏事件API"""
    url = f"{BASE_URL}/api/bingo_speed/event"
    data = {
        "player": "Venti_Lynn",
        "team": "BLACK",
        "event": "Item_Found",
        "lore": "diamond"
    }
    response = requests.post(url, json=data)
    print(f"Game Event API: {response.status_code} - {response.json()}")

def test_game_score():
    """测试游戏分数更新API"""
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
    response = requests.post(url, json=data)
    print(f"Game Score API: {response.status_code} - {response.json()}")

def test_global_score():
    """测试全局分数更新API"""
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
    response = requests.post(url, json=data)
    print(f"Global Score API: {response.status_code} - {response.json()}")

def test_global_event():
    """测试全局事件API"""
    url = f"{BASE_URL}/api/game/event"
    data = {
        "status": "gaming",
        "game": {
            "name": "宾果时速",
            "round": 1
        }
    }
    response = requests.post(url, json=data)
    print(f"Global Event API: {response.status_code} - {response.json()}")

def test_vote_event():
    """测试投票事件API"""
    url = f"{BASE_URL}/api/vote/event"
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
    response = requests.post(url, json=data)
    print(f"Vote Event API: {response.status_code} - {response.json()}")

if __name__ == "__main__":
    print("Testing all API endpoints...")
    print("=" * 50)
    
    try:
        test_game_event()
        test_game_score()
        test_global_score()
        test_global_event()
        test_vote_event()
        print("=" * 50)
        print("All tests completed!")
    except requests.ConnectionError:
        print("Error: Could not connect to the server. Make sure the server is running on localhost:8000")
    except Exception as e:
        print(f"Error: {e}")