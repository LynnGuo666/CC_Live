/**
 * 排行榜组件
 * 显示实时比赛排行榜，支持排名变化动画
 */

import React from 'react'
import { LeaderboardEntry } from '@/store/liveStore'
import { Trophy, Medal, Award, Users, Crown } from 'lucide-react'

interface LeaderboardItemProps {
  entry: LeaderboardEntry
  index: number
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ entry, index }) => {
  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">
          {rank}
        </span>
    }
  }

  // 获取排名样式
  const getRankClassName = (rank: number) => {
    const baseClass = "flex items-center justify-between p-3 rounded-lg transition-all duration-200"
    
    switch (rank) {
      case 1:
        return `${baseClass} rank-1`
      case 2:
        return `${baseClass} rank-2`
      case 3:
        return `${baseClass} rank-3`
      default:
        return `${baseClass} bg-gray-50 hover:bg-gray-100`
    }
  }

  return (
    <div className={getRankClassName(entry.rank)}>
      <div className="flex items-center space-x-3">
        {getRankIcon(entry.rank)}
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {entry.player_name}
          </div>
          {entry.team && (
            <div className="text-xs opacity-75">
              团队: {entry.team}
            </div>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-bold text-lg">
          {entry.total_score.toLocaleString()}
        </div>
        <div className="text-xs opacity-75">
          分数
        </div>
      </div>
    </div>
  )
}

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[]
  className?: string
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ 
  leaderboard, 
  className = '' 
}) => {
  // 按排名排序
  const sortedLeaderboard = [...leaderboard].sort((a, b) => a.rank - b.rank)

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          排行榜
          <span className="ml-2 text-sm text-gray-500">
            ({sortedLeaderboard.length} 位玩家)
          </span>
        </h3>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
        {sortedLeaderboard.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无排行数据</p>
            <p className="text-sm">等待比赛开始...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedLeaderboard.map((entry, index) => (
              <LeaderboardItem 
                key={`${entry.player_name}-${entry.rank}`} 
                entry={entry} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}