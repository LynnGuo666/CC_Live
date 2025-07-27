'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GameEvent {
  id?: number
  game_id?: string
  player: string
  team: string
  event: string
  lore: string
  timestamp: string
  score_predictions?: Record<string, number>
  predicted_scores?: Record<string, number>
}

interface ScoreUpdate {
  game_id?: string
  player: string
  team: string
  score: number
}

interface GameStatus {
  status: string
  game: {
    name: string
    round: number
  }
}

interface VoteData {
  game: string
  ticket: number
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [votingData, setVotingData] = useState<VoteData[]>([])
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 5
  const retryCount = useRef(0)

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        retryCount.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'game_event':
              setEvents(prev => [
                {
                  ...data.data,
                  timestamp: data.data.timestamp || new Date().toISOString()
                },
                ...prev.slice(0, 49) // 保持最新50条
              ])
              
              // 更新分数预测
              if (data.data.score_predictions) {
                setScores(prev => ({
                  ...prev,
                  ...data.data.score_predictions
                }))
              }
              break

            case 'score_update':
              if (data.data.scores) {
                const newScores: Record<string, number> = {}
                data.data.scores.forEach((score: ScoreUpdate) => {
                  newScores[score.player] = score.score
                })
                setScores(prev => ({ ...prev, ...newScores }))
              }
              break

            case 'global_event':
              setGameStatus(data.data)
              break

            case 'vote_event':
              setVotingData(data.data)
              break

            case 'viewer_count':
              setViewerCount(data.count)
              break

            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // 尝试重连
        if (retryCount.current < maxRetries) {
          retryCount.current++
          reconnectTimer.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (${retryCount.current}/${maxRetries})`)
            connect()
          }, 5000 * retryCount.current) // 递增延迟
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
    }
  }, [url])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }, [])

  return {
    isConnected,
    events,
    scores,
    gameStatus,
    viewerCount,
    votingData,
    sendMessage
  }
}