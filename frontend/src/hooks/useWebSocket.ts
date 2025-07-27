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

interface Tournament {
  id: number
  name: string
  status: string
  current_game: string
  current_round: number
}

interface Leaderboard {
  teams: Array<{ name: string; score: number }>
  players: Array<{ name: string; score: number; team: string }>
}

interface VotingData {
  active: boolean
  time_remaining: number
  votes: Array<{ game: string; ticket: number }>
}

interface TournamentData {
  tournament: Tournament
  leaderboard: Leaderboard
  current_game_events: GameEvent[]
  scores: Record<string, number>
  voting: VotingData
  viewer_count: number
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null)
  
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
          const data: TournamentData = JSON.parse(event.data)
          setTournamentData(data)
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
    tournamentData,
    // 提供兼容的属性以减少前端组件改动
    tournament: tournamentData?.tournament || null,
    leaderboard: tournamentData?.leaderboard || null,
    events: tournamentData?.current_game_events || [],
    scores: tournamentData?.scores || {},
    gameStatus: tournamentData?.tournament ? {
      status: tournamentData.tournament.status,
      game: tournamentData.tournament.current_game ? {
        name: tournamentData.tournament.current_game,
        round: tournamentData.tournament.current_round
      } : undefined
    } : null,
    viewerCount: tournamentData?.viewer_count || 0,
    votingData: tournamentData?.voting || null,
    sendMessage
  }
}