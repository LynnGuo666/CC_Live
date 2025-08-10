'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GameEvent } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES, GAME_NAMES } from '@/types/tournament';

interface GameEventDisplayProps {
  events: GameEvent[];
  maxEvents?: number;
  className?: string;
  enableFilter?: boolean; // 是否显示队伍过滤开关
}

export default function GameEventDisplay({ events, maxEvents = 10, className = "", enableFilter = false }: GameEventDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [teamFilter, setTeamFilter] = useState<string>(''); // 队伍ID，空为全部

  const filtered = useMemo(() => {
    if (!teamFilter) return events;
    return events.filter(e => e.team === teamFilter);
  }, [events, teamFilter]);
  const displayEvents = filtered.slice(0, maxEvents);

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

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '刚刚';
    
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

  const formatPostTime = (postTime?: string) => {
    if (!postTime) return '';
    
    const date = new Date(postTime);
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTeamColor = (teamId: string, fallback?: string) => {
    if (fallback) return fallback;
    return TEAM_COLORS[teamId] || '#666666';
  };

  // removed unused getTeamName

  const getGameName = (gameId: string) => {
    return GAME_NAMES[gameId] || gameId;
  };

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">实时事件</h2>
        {enableFilter && (
          <div className="flex items-center gap-2">
            {teamFilter && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: TEAM_COLORS[teamFilter] || '#666' }}
              />
            )}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="text-sm border rounded-md px-2 py-1 bg-white"
            >
              <option value="">全部队伍</option>
              {Object.keys(TEAM_NAMES).map((tid) => (
                <option key={tid} value={tid}>{TEAM_NAMES[tid]}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {displayEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">📡</div>
            <div className="text-sm">等待事件数据...</div>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            <div className="p-3 space-y-1">
              {displayEvents.map((event, index) => {
                const eventColors = getEventColor(event.event);
                const isRecentEvent = index < 3; // Highlight recent events
                
                return (
                  <div
                    key={`${event.post_time || event.timestamp}-${index}`}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isRecentEvent 
                        ? `${eventColors.bg} border border-gray-200` 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  >
                    {/* Event Icon */}
                    <div className={`flex-shrink-0 w-6 h-6 ${eventColors.icon} rounded-full flex items-center justify-center`}>
                      <span className="text-xs">{getEventIcon(event.event)}</span>
                    </div>

                    {/* Game Badge */}
                    {event.game_id && (
                      <span className="flex-shrink-0 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        {getGameName(event.game_id)}
                      </span>
                    )}

                    {/* Event Description */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {getEventDescription(event)}
                        {event.lore && (
                          <span className="text-gray-600 ml-1">
                            - {event.lore}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Player Info */}
                    {event.player && (
                      <div className="flex-shrink-0 flex items-center space-x-1">
                        {event.team && (
                          <div
                            className="w-2 h-2 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: getTeamColor(event.team, event.team_color) }}
                          />
                        )}
                        <span className="text-xs font-medium text-gray-700 truncate max-w-20">
                          {event.player}
                        </span>
                      </div>
                    )}

                    {/* Post Time (更精确的服务器接收时间) */}
                    <div className="flex-shrink-0 flex flex-col items-end text-xs text-gray-500">
                      <span>{formatTimestamp(event.post_time || event.timestamp)}</span>
                      {event.post_time && (
                        <span className="text-gray-400">{formatPostTime(event.post_time)}</span>
                      )}
                    </div>

                    {/* New Badge */}
                    {isRecentEvent && (
                      <span className="flex-shrink-0 text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md">
                        新
                      </span>
                    )}
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