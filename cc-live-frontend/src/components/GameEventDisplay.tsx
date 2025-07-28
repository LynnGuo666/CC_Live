'use client';

import { GameEvent } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES, GAME_NAMES } from '@/types/tournament';

interface GameEventDisplayProps {
  events: Array<{
    game_id: string;
    event: GameEvent;
    timestamp: string;
  }>;
  maxEvents?: number;
}

export default function GameEventDisplay({ events, maxEvents = 10 }: GameEventDisplayProps) {
  const displayEvents = events.slice(0, maxEvents);

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
      'Round_Over': '⏰'
    };

    return iconMap[eventType] || '🎮';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">实时事件</h2>
      
      {displayEvents.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          暂无事件数据
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayEvents.map((item, index) => (
            <div
              key={`${item.timestamp}-${index}`}
              className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Event Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-lg">{getEventIcon(item.event.event)}</span>
              </div>

              {/* Event Content */}
              <div className="flex-grow min-w-0">
                {/* Game and Time */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {getGameName(item.game_id)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>

                {/* Event Description */}
                <div className="mb-2">
                  <span className="font-semibold text-gray-800">
                    {getEventDescription(item.event)}
                  </span>
                  {item.event.lore && (
                    <span className="text-gray-600 ml-2">
                      ({item.event.lore})
                    </span>
                  )}
                </div>

                {/* Player and Team Info */}
                <div className="flex items-center space-x-4">
                  {item.event.player && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">玩家:</span>
                      <span className="font-medium text-gray-800">{item.event.player}</span>
                    </div>
                  )}
                  
                  {item.event.team && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">队伍:</span>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-1 border border-gray-300"
                          style={{ backgroundColor: getTeamColor(item.event.team) }}
                        />
                        <span className="font-medium text-gray-800">
                          {getTeamName(item.event.team)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}