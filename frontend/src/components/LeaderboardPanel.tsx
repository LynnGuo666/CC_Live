'use client'

import { useState, useMemo } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Users } from 'lucide-react'

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

interface Leaderboard {
  teams: Array<{ name: string; score: number }>
  players: Array<{ name: string; score: number; team: string }>
}

interface LeaderboardPanelProps {
  leaderboard: Leaderboard | null
  scores: Record<string, number>
}

const teamColors: Record<string, string> = {
  RED: '#FF0000',
  ORANGE: '#FFA500',
  BLUE: '#0000FF',
  GREEN: '#00FF00',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  PURPLE: '#800080',
  WHITE: '#FFFFFF',
  PINK: '#FFC0CB',
  BROWN: '#A52A2A',
  LIGHT_BLUE: '#ADD8E6',
  LIGHT_GRAY: '#D3D3D3'
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Trophy className="w-5 h-5 text-amber-600" />
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>
  }
}

export default function LeaderboardPanel({ leaderboard, scores }: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams')

  // 合并实时分数和积分榜数据
  const enhancedLeaderboard = useMemo(() => {
    if (!leaderboard) return null

    const enhancedPlayers = leaderboard.players.map(player => ({
      ...player,
      liveScore: scores[player.name] || player.score,
      scoreChange: (scores[player.name] || player.score) - player.score
    })).sort((a, b) => b.liveScore - a.liveScore)

    // 重新计算队伍总分
    const teamScores: Record<string, number> = {}
    enhancedPlayers.forEach(player => {
      if (!teamScores[player.team]) {
        teamScores[player.team] = 0
      }
      teamScores[player.team] += player.liveScore
    })

    const enhancedTeams = leaderboard.teams.map(team => ({
      ...team,
      liveScore: teamScores[team.name] || team.score,
      scoreChange: (teamScores[team.name] || team.score) - team.score
    })).sort((a, b) => b.liveScore - a.liveScore)

    return {
      teams: enhancedTeams,
      players: enhancedPlayers
    }
  }, [leaderboard, scores])

  if (!enhancedLeaderboard) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>积分榜加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      {/* 标题和切换按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500 dark:text-yellow-400" />
          积分榜
        </h2>
        
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            队伍
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === 'players'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            个人
          </button>
        </div>
      </div>

      {/* 积分榜内容 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {activeTab === 'teams' ? (
            <div className="space-y-3">
              {enhancedLeaderboard.teams.map((team, index) => (
                <div
                  key={team.name}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(index + 1)}
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-500"
                          style={{ backgroundColor: teamColors[team.name] || '#888' }}
                        />
                        <span className="font-semibold text-white">{team.name}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {team.liveScore}
                      </div>
                      {team.scoreChange !== 0 && (
                        <div className={`text-sm ${
                          team.scoreChange > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {team.scoreChange > 0 ? '+' : ''}{team.scoreChange}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {enhancedLeaderboard.players.map((player, index) => (
                <div
                  key={player.name}
                  className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(index + 1)}
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {player.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {player.team}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {player.liveScore}
                      </div>
                      {player.scoreChange !== 0 && (
                        <div className={`text-xs ${
                          player.scoreChange > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {player.scoreChange > 0 ? '+' : ''}{player.scoreChange}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部统计 */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-center text-sm text-gray-400">
          实时更新 • 共{enhancedLeaderboard.teams.length}支队伍 • {enhancedLeaderboard.players.length}名玩家
        </div>
      </div>
    </div>
  )
}