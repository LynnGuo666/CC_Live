'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface Player {
  id: string
  name: string
  score: number
  team_id: string
}

interface Team {
  id: string
  name: string
  total_score: number
  players: Player[]
}

interface Tournament {
  id: number
  name: string
  status: string
  current_game?: string
  current_round: number
  teams: Team[]
}

interface Leaderboard {
  teams: Array<{ name: string; score: number }>
  players: Array<{ name: string; score: number; team: string }>
}

const API_BASE_URL = 'http://localhost:8000/api'

export function useTournamentData() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournament = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournament`)
      setTournament(response.data)
    } catch (err) {
      console.error('Failed to fetch tournament data:', err)
      setError('Failed to fetch tournament data')
    }
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leaderboard`)
      setLeaderboard(response.data)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
      setError('Failed to fetch leaderboard')
    }
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchTournament(),
        fetchLeaderboard()
      ])
    } finally {
      setIsLoading(false)
    }
  }, [fetchTournament, fetchLeaderboard])

  const submitVote = useCallback(async (votes: Array<{ game: string; ticket: number }>) => {
    try {
      await axios.post(`${API_BASE_URL}/vote/event`, votes)
      return true
    } catch (err) {
      console.error('Failed to submit vote:', err)
      return false
    }
  }, [])

  const getGameEvents = useCallback(async (gameId: string, limit = 50) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/game/${gameId}/events?limit=${limit}`)
      return response.data
    } catch (err) {
      console.error('Failed to fetch game events:', err)
      return []
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    tournament,
    leaderboard,
    isLoading,
    error,
    refreshData,
    submitVote,
    getGameEvents
  }
}