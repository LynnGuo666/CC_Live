'use client'

import { useEffect, useRef } from 'react'
import { Activity, Zap, Target, Sword, Crown } from 'lucide-react'

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

interface LiveEventFeedProps {
  events: GameEvent[]
  scores: Record<string, number>
}

const eventIcons: Record<string, JSX.Element> = {
  'Item_Found': <Target className="w-4 h-4" />,
  'Kill': <Sword className="w-4 h-4" />,
  'Player_Tagged': <Zap className="w-4 h-4" />,
  'Wool_Win': <Crown className="w-4 h-4" />,
  'Player_Fall': <Activity className="w-4 h-4" />,
  'Death': <Activity className="w-4 h-4" />,
  'Checkpoint': <Target className="w-4 h-4" />
}

const eventColors: Record<string, string> = {
  'Item_Found': 'text-green-400',
  'Kill': 'text-red-400',
  'Player_Tagged': 'text-yellow-400',
  'Wool_Win': 'text-purple-400',
  'Player_Fall': 'text-orange-400',
  'Death': 'text-red-500',
  'Checkpoint': 'text-blue-400'
}

const eventDescriptions: Record<string, string> = {
  'Item_Found': '找到物品',
  'Kill': '击杀',
  'Player_Tagged': '被标记',
  'Wool_Win': '羊毛获胜',
  'Player_Fall': '掉落',
  'Death': '淘汰',
  'Checkpoint': '到达检查点',
  'Round_Start': '回合开始',
  'Round_Over': '回合结束',
  'Chaser_Selected': '选为追击者'
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
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

export default function LiveEventFeed({ events, scores }: LiveEventFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 当有新事件时，滚动到顶部
    if (containerRef.current && events.length > 0) {
      containerRef.current.scrollTop = 0
    }
  }, [events])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-400" />
          实时事件动态
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {events.length} 条最新事件
        </div>
      </div>

      {/* 事件列表 */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={containerRef}
          className="h-full overflow-y-auto custom-scrollbar space-y-2"
        >
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>等待游戏事件...</p>
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 event-enter"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* 事件图标 */}
                    <div className={`p-2 rounded-full bg-gray-200 dark:bg-gray-600 ${eventColors[event.event] || 'text-gray-600 dark:text-gray-400'}`}>
                      {eventIcons[event.event] || <Activity className="w-4 h-4" />}
                    </div>

                    {/* 事件内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {/* 玩家名称 */}
                        {event.player && (
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {event.player}
                          </span>
                        )}
                        
                        {/* 队伍标识 */}
                        {event.team && (
                          <div className="flex items-center space-x-1">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-500"
                              style={{ backgroundColor: teamColors[event.team] || '#888' }}
                            />
                            <span className="text-sm text-gray-300">{event.team}</span>
                          </div>
                        )}
                      </div>

                      {/* 事件描述 */}
                      <div className="text-sm text-gray-300 mb-1">
                        {eventDescriptions[event.event] || event.event}
                        {event.lore && (
                          <span className="text-gray-600 dark:text-gray-400 ml-1">
                            · {event.lore}
                          </span>
                        )}
                      </div>

                      {/* 分数预测 */}
                      {event.score_predictions && Object.keys(event.score_predictions).length > 0 && (
                        <div className="text-xs text-green-400 bg-green-900/20 rounded px-2 py-1 mt-2">
                          <span className="opacity-75">预测分数: </span>
                          {Object.entries(event.score_predictions).map(([entity, score]) => (
                            <span key={entity} className="mr-2">
                              {entity}: +{score}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 时间戳 */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap ml-2">
                    {formatTime(event.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 底部状态 */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>实时更新中</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>在线</span>
          </div>
        </div>
      </div>
    </div>
  )
}