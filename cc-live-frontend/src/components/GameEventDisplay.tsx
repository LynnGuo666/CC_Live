'use client';

import { useEffect, useRef } from 'react';
import { GameEvent } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES, GAME_NAMES } from '@/types/tournament';

interface GameEventDisplayProps {
  events: Array<{
    game_id: string;
    event: GameEvent;
    timestamp: string;
  }>;
  maxEvents?: number;
  className?: string;
}

export default function GameEventDisplay({ events, maxEvents = 10, className = "" }: GameEventDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayEvents = events.slice(0, maxEvents);

  // Auto scroll to top when new events come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const getEventDescription = (event: GameEvent) => {
    const eventMap: Record<string, string> = {
      'Item_Found': '找到物品',
      'Chaser_Selected': '选择追击者',
      'Round_Start': '回合开始', 
      'Player_Tagged': '玩家被标记',
      'Round_Over': '回合结束',
      'Kill': '击杀',
      'Wool_Win': '羊毛获胜',
      'Player_Fall': '玩家掉落',
      'Fall': '掉入虚空',
      'Border_Start': '边界开始收缩',
      'Border_End': '边界收缩结束',
      'Cod_Passed': '鳕鱼传递',
      'Death': '爆炸身亡',
      'Checkpoint': '到达检查点',
      'Player_Mistake': '玩家失误',
      'Player_Finish': '完成跑酷',
      'Player_Eliminated': '玩家被淘汰',
      'Round_Win': '回合获胜',
      'Tournament_End': '锦标赛结束'
    };

    return eventMap[event.event] || event.event;
  };

  const getEventIcon = (eventType: string) => {
    const iconMap: Record<string, string> = {
      'Item_Found': '📦',
      'Kill': '⚔️',
      'Player_Fall': '💥',
      'Fall': '🕳️',
      'Death': '💀',
      'Round_Win': '🏆',
      'Player_Tagged': '🏃',
      'Checkpoint': '🎯',
      'Player_Finish': '🏁',
      'Round_Start': '🚀',
      'Round_Over': '⏰',
      'Cod_Passed': '🐟',
      'Border_Start': '🔄',
      'Border_End': '⏹️',
      'Wool_Win': '🐑',
      'Player_Eliminated': '❌'
    };

    return iconMap[eventType] || '🎮';
  };

  const getEventColor = (eventType: string) => {
    const colorMap: Record<string, { bg: string, icon: string }> = {
      'Kill': { bg: 'bg-red-50', icon: 'bg-red-100' },
      'Death': { bg: 'bg-red-50', icon: 'bg-red-100' },
      'Player_Fall': { bg: 'bg-orange-50', icon: 'bg-orange-100' },
      'Round_Win': { bg: 'bg-yellow-50', icon: 'bg-yellow-100' },
      'Round_Start': { bg: 'bg-green-50', icon: 'bg-green-100' },
      'Player_Finish': { bg: 'bg-green-50', icon: 'bg-green-100' },
      'Checkpoint': { bg: 'bg-blue-50', icon: 'bg-blue-100' },
      'Item_Found': { bg: 'bg-purple-50', icon: 'bg-purple-100' }
    };

    return colorMap[eventType] || { bg: 'bg-gray-50', icon: 'bg-gray-100' };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return '刚刚';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}分钟前`;
    } else {
      return date.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getTeamColor = (teamId: string) => {
    return TEAM_COLORS[teamId] || '#666666';
  };

  const getTeamName = (teamId: string) => {
    return TEAM_NAMES[teamId] || teamId;
  };

  const getGameName = (gameId: string) => {
    return GAME_NAMES[gameId] || gameId;
  };

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200/50">
        <h2 className="text-xl font-semibold text-gray-900">实时事件</h2>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {displayEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">📡</div>
            <div className="font-medium">等待事件数据...</div>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{ height: '100%' }}
          >
            <div className="p-4 space-y-3">
              {displayEvents.map((item, index) => {
                const eventColors = getEventColor(item.event.event);
                const isRecentEvent = index < 3; // Highlight recent events
                
                return (
                  <div
                    key={`${item.timestamp}-${index}`}
                    className={`relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      isRecentEvent 
                        ? `${eventColors.bg} border-gray-200 shadow-sm` 
                        : 'bg-white/50 border-gray-100'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-6 w-1 h-8 bg-gradient-to-b from-blue-400 to-transparent rounded-full"></div>
                    
                    <div className="ml-4 flex items-start space-x-3">
                      {/* Event Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 ${eventColors.icon} rounded-full flex items-center justify-center`}>
                        <span className="text-sm">{getEventIcon(item.event.event)}</span>
                      </div>

                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                              {getGameName(item.game_id)}
                            </span>
                            {isRecentEvent && (
                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                                新
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>

                        {/* Event Description */}
                        <div className="mb-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {getEventDescription(item.event)}
                          </span>
                          {item.event.lore && (
                            <span className="text-gray-600 text-sm ml-2">
                              - {item.event.lore}
                            </span>
                          )}
                        </div>

                        {/* Player and Team Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {item.event.player && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">👤</span>
                                <span className="text-xs font-medium text-gray-800">{item.event.player}</span>
                              </div>
                            )}
                            
                            {item.event.team && (
                              <div className="flex items-center space-x-1">
                                <div
                                  className="w-2 h-2 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: getTeamColor(item.event.team) }}
                                />
                                <span className="text-xs font-medium text-gray-800">
                                  {getTeamName(item.event.team)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}