/**
 * 锦标赛阶段查看组件
 * 显示游戏阶段的比赛数据和实时信息
 */

'use client'

import React, { useEffect, useState } from 'react'
import { TournamentStage, useLiveStore } from '@/store/liveStore'
import { Gamepad2, Users, Target, TrendingUp } from 'lucide-react'

interface TournamentStageViewProps {
  stage: TournamentStage
}

const TournamentStageView: React.FC<TournamentStageViewProps> = ({ stage }) => {
  const { 
    events, 
    playerScores, 
    leaderboard, 
    teamStats,
    streamMode,
    currentTournamentId
  } = useLiveStore()
  
  const [activeTab, setActiveTab] = useState<'events' | 'leaderboard' | 'players' | 'teams'>('events')

  // 获取阶段相关的比赛数据
  useEffect(() => {
    // 这里可以根据stage.id获取特定阶段的数据
    // 暂时使用全局的比赛数据
  }, [stage.id])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无事件数据
              </div>
            ) : (
              events.slice(0, 10).map((event, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{event.event_type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                  </div>
                  {event.player && (
                    <div className="text-sm text-gray-600">
                      玩家: {event.player}
                    </div>
                  )}
                  {event.data && (
                    <div className="text-xs text-gray-500 mt-1">
                      <pre className="bg-gray-100 p-1 rounded overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )
      case 'leaderboard':
        return (
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无排行榜数据
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-amber-600' : 'bg-blue-500'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{entry.player_name}</h4>
                      {entry.team && (
                        <p className="text-sm text-gray-600">{entry.team}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {entry.total_score} 分
                  </div>
                </div>
              ))
            )}
          </div>
        )
      case 'players':
        return (
          <div className="space-y-3">
            {playerScores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无玩家数据
              </div>
            ) : (
              playerScores.map((player, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{player.player_name}</h4>
                    <div className="text-lg font-bold text-blue-600">
                      {player.score} 分
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>等级: {player.level}</div>
                    <div>血量: {player.health}</div>
                    <div>经验: {player.experience}</div>
                  </div>
                  
                  {player.custom_stats && (
                    <div className="mt-3 text-xs text-gray-500">
                      <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(player.custom_stats, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )
      case 'teams':
        return (
          <div className="space-y-3">
            {teamStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无团队数据
              </div>
            ) : (
              teamStats.map((team, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{team.team_name}</h4>
                    <div className="text-lg font-bold text-blue-600">
                      {team.total_score} 分
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>目标: {team.objectives}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>进度: {team.progress}%</span>
                    </div>
                  </div>
                  
                  {team.custom_stats && (
                    <div className="mt-3 text-xs text-gray-500">
                      <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(team.custom_stats, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            暂无数据
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 阶段头部信息 */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Gamepad2 className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">{stage.title}</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                stage.status === 'in_progress' 
                  ? 'bg-green-100 text-green-800' 
                  : stage.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {stage.status === 'in_progress' ? '进行中' : 
                 stage.status === 'pending' ? '等待开始' : '已结束'}
              </span>
            </div>
            
            {stage.description && (
              <p className="text-gray-600 mb-2">{stage.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {stage.game_type && (
                <span>游戏类型: {stage.game_type}</span>
              )}
              {stage.duration_minutes && (
                <span>预计时长: {stage.duration_minutes}分钟</span>
              )}
              <span>阶段ID: {stage.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 视频直播区域 */}
      {streamMode === 'video' && currentTournamentId && (
        <div className="p-6 border-b border-gray-200">
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">视频直播播放器</p>
              <p className="text-sm text-gray-400 mt-2">
                集成B站或其他直播平台
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 数据展示标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            实时事件
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            排行榜
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'players'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            玩家详情
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'teams'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            团队统计
          </button>
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default TournamentStageView