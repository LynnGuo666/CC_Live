/**
 * WebSocket客户端管理
 * 负责与后端WebSocket连接，处理实时数据推送
 */

import { io, Socket } from 'socket.io-client'
import { useLiveStore } from '@/store/liveStore'

class WebSocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * 连接到指定比赛的WebSocket
   */
  connect(matchId: string) {
    // 如果已经连接到相同比赛，直接返回
    if (this.socket && this.socket.connected) {
      const currentMatch = useLiveStore.getState().currentMatchId
      if (currentMatch === matchId) {
        return
      }
      this.disconnect()
    }

    // 创建新的Socket连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/live/${matchId}`
    
    // 使用原生WebSocket而不是socket.io
    this.connectWebSocket(wsUrl, matchId)
  }

  /**
   * 原生WebSocket连接
   */
  private connectWebSocket(url: string, matchId: string) {
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log(`✅ WebSocket连接成功: ${matchId}`)
        this.reconnectAttempts = 0
        useLiveStore.getState().setConnected(true)
        useLiveStore.getState().setCurrentMatch(matchId)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket连接已断开')
        useLiveStore.getState().setConnected(false)
        this.attemptReconnect(url, matchId)
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket连接错误:', error)
        useLiveStore.getState().setConnected(false)
      }

      // 保存WebSocket实例（类型转换）
      this.socket = ws as any
      
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: any) {
    const store = useLiveStore.getState()

    switch (data.type) {
      case 'connection_established':
        console.log('🎮 已连接到直播间:', data.match_id)
        break

      case 'game_event':
        console.log('🎯 收到游戏事件:', data.event)
        store.addEvent(data.event)
        break

      case 'player_scores_update':
        console.log('📊 玩家分数更新:', data.players)
        store.updatePlayerScores(data.players)
        break

      case 'leaderboard_update':
        console.log('🏆 排行榜更新:', data.leaderboard)
        store.updateLeaderboard(data.leaderboard)
        break

      case 'match_status_update':
        console.log('⚡ 比赛状态更新:', data.status)
        store.setMatchStatus(data.status)
        break

      case 'team_stats_update':
        console.log('👥 团队数据更新:', data.teams)
        store.updateTeamStats(data.teams)
        break

      case 'new_comment':
        console.log('💬 新评论:', data.comment)
        store.addComment(data.comment)
        break

      case 'pong':
        // 心跳响应，不需要处理
        break

      default:
        console.log('📩 未知消息类型:', data.type, data)
    }
  }

  /**
   * 发送消息到服务器
   */
  sendMessage(message: any) {
    if (this.socket && (this.socket as any).readyState === WebSocket.OPEN) {
      (this.socket as any).send(JSON.stringify(message))
    } else {
      console.warn('WebSocket未连接，无法发送消息')
    }
  }

  /**
   * 发送评论
   */
  sendComment(username: string, content: string) {
    this.sendMessage({
      type: 'comment',
      username,
      content
    })
  }

  /**
   * 发送心跳
   */
  sendPing() {
    this.sendMessage({
      type: 'ping',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(url: string, matchId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 达到最大重连次数，停止重连')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 ${delay}ms后尝试第${this.reconnectAttempts}次重连...`)
    
    setTimeout(() => {
      this.connectWebSocket(url, matchId)
    }, delay)
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      (this.socket as any).close()
      this.socket = null
    }
    useLiveStore.getState().setConnected(false)
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.socket ? (this.socket as any).readyState === WebSocket.OPEN : false
  }
}

// 导出单例实例
export const wsManager = new WebSocketManager()