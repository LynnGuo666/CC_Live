/**
 * 玩家详细数据面板
 * 显示玩家分数、等级、经验等详细信息
 */

import React, { useState } from 'react'
import { PlayerScore } from '@/store/liveStore'
import { User, Heart, Star, Zap, BarChart3, TrendingUp } from 'lucide-react'

interface PlayerCardProps {
  player: PlayerScore
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  // 计算健康状态颜色
  const getHealthColor = (health: number) => {
    if (health > 70) return 'text-green-500'
    if (health > 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  // 计算健康状态背景
  const getHealthBg = (health: number) => {
    if (health > 70) return 'bg-green-500'
    if (health > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{player.player_name}</h4>
            <p className="text-xs text-gray-500">玩家</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {player.score.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">分数</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* 等级 */}
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-purple-500" />
          <div>
            <div className="text-sm font-medium">等级 {player.level}</div>
            <div className="text-xs text-gray-500">Level</div>
          </div>
        </div>

        {/* 经验值 */}
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="text-sm font-medium">{player.experience}</div>
            <div className="text-xs text-gray-500">经验</div>
          </div>
        </div>
      </div>

      {/* 健康值条 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1">
            <Heart className={`w-4 h-4 ${getHealthColor(player.health)}`} />
            <span className="text-sm font-medium">健康值</span>
          </div>
          <span className={`text-sm font-bold ${getHealthColor(player.health)}`}>
            {player.health}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getHealthBg(player.health)}`}
            style={{ width: `${Math.max(0, Math.min(100, player.health))}%` }}
          />
        </div>
      </div>

      {/* 自定义统计数据 */}
      {player.custom_stats && Object.keys(player.custom_stats).length > 0 && (
        <div className="border-t border-blue-200 pt-3">
          <div className="text-xs text-gray-600 mb-2">详细数据</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(player.custom_stats).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="text-gray-500">{key}:</span>
                <span className="ml-1 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PlayerDetailsPanelProps {
  playerScores: PlayerScore[]
  className?: string
}

export const PlayerDetailsPanel: React.FC<PlayerDetailsPanelProps> = ({ 
  playerScores, 
  className = '' 
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'level' | 'health'>('score')

  // 排序玩家数据
  const sortedPlayers = [...playerScores].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score
      case 'level':
        return b.level - a.level
      case 'health':
        return b.health - a.health
      default:
        return b.score - a.score
    }
  })

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            玩家数据
          </h3>
          
          {/* 排序选择器 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="score">分数</option>
              <option value="level">等级</option>
              <option value="health">健康值</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
        {sortedPlayers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无玩家数据</p>
            <p className="text-sm">等待游戏服务器推送数据...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <PlayerCard key={player.player_name} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}