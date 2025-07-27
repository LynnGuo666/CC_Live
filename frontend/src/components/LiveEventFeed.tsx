/**
 * 游戏事件展示组件
 * 显示实时游戏事件流，如玩家行为、成就等
 */

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { GameEvent } from '@/store/liveStore'
import { Trophy, Sword, Package, Star, Zap } from 'lucide-react'

interface EventItemProps {
  event: GameEvent
}

export const EventItem: React.FC<EventItemProps> = ({ event }) => {
  // 根据事件类型获取图标和样式
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'kill':
      case 'player_kill':
        return <Sword className="w-4 h-4 text-red-500" />
      case 'achievement':
        return <Trophy className="w-4 h-4 text-yellow-500" />
      case 'item_pickup':
        return <Package className="w-4 h-4 text-green-500" />
      case 'level_up':
        return <Star className="w-4 h-4 text-purple-500" />
      default:
        return <Zap className="w-4 h-4 text-blue-500" />
    }
  }

  // 格式化事件描述
  const formatEventDescription = (event: GameEvent) => {
    const { event_type, player, target, data } = event
    
    switch (event_type) {
      case 'kill':
      case 'player_kill':
        return `${player} 击败了 ${target}`
      case 'achievement':
        return `${player} 获得成就: ${data?.achievement_name || '未知成就'}`
      case 'item_pickup':
        return `${player} 获得了 ${data?.item_name || '物品'}`
      case 'level_up':
        return `${player} 升级到 ${data?.level || '?'} 级`
      case 'game_start':
        return '🎮 游戏开始！'
      case 'game_end':
        return '🏁 游戏结束！'
      default:
        return `${player || '系统'}: ${event_type}`
    }
  }

  // 获取事件卡片样式类
  const getCardClassName = (eventType: string) => {
    const baseClass = 'event-card'
    
    switch (eventType) {
      case 'kill':
      case 'player_kill':
        return `${baseClass} kill`
      case 'achievement':
        return `${baseClass} achievement`
      case 'item_pickup':
        return `${baseClass} item_pickup`
      default:
        return `${baseClass} default`
    }
  }

  return (
    <div className={getCardClassName(event.event_type)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {getEventIcon(event.event_type)}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {formatEventDescription(event)}
            </p>
            {event.data && (
              <div className="mt-1 text-xs text-gray-500">
                {event.data.location && (
                  <span>
                    位置: ({event.data.location.x}, {event.data.location.y}, {event.data.location.z})
                  </span>
                )}
                {event.data.weapon && (
                  <span className="ml-2">武器: {event.data.weapon}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400 ml-2">
          {formatDistanceToNow(new Date(event.timestamp), { 
            addSuffix: true, 
            locale: zhCN 
          })}
        </div>
      </div>
    </div>
  )
}

interface LiveEventFeedProps {
  events: GameEvent[]
  className?: string
}

export const LiveEventFeed: React.FC<LiveEventFeedProps> = ({ 
  events, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-500" />
          实时事件
        </h3>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无游戏事件</p>
            <p className="text-sm">等待游戏服务器推送数据...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}