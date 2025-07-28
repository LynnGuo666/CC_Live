'use client';

import { GameStatus } from '@/types/tournament';
import { GAME_NAMES } from '@/types/tournament';

interface GameStatusDisplayProps {
  gameStatus: GameStatus | null;
  currentRound: Record<string, number>;
}

export default function GameStatusDisplay({ gameStatus, currentRound }: GameStatusDisplayProps) {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, string> = {
      'gaming': '🎮',
      'waiting': '⏳',
      'voting': '🗳️',
      'break': '☕',
      'finished': '🏁'
    };
    return iconMap[status] || '❓';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'gaming': '游戏进行中',
      'waiting': '等待中',
      'voting': '投票中',
      'break': '休息时间',
      'finished': '已结束'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'gaming': 'bg-green-100 text-green-800 border-green-300',
      'waiting': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'voting': 'bg-blue-100 text-blue-800 border-blue-300',
      'break': 'bg-purple-100 text-purple-800 border-purple-300',
      'finished': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getGameName = (gameId: string) => {
    return GAME_NAMES[gameId] || gameId;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">比赛状态</h2>
      
      {!gameStatus ? (
        <div className="text-center text-gray-500 py-8">
          暂无状态数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Status */}
          <div className={`flex items-center justify-center p-4 rounded-lg border-2 ${getStatusColor(gameStatus.status)}`}>
            <span className="text-2xl mr-3">{getStatusIcon(gameStatus.status)}</span>
            <span className="text-xl font-bold">{getStatusText(gameStatus.status)}</span>
          </div>

          {/* Current Game */}
          {gameStatus.game && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700 mb-2">当前游戏</div>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {gameStatus.game.name}
                </div>
                <div className="text-lg text-purple-600">
                  第 {gameStatus.game.round} 轮
                </div>
              </div>
            </div>
          )}

          {/* Round Info for All Games */}
          {Object.keys(currentRound).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-700 mb-3 text-center">各游戏轮次</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(currentRound).map(([gameId, round]) => (
                  <div key={gameId} className="bg-white rounded p-3 text-center shadow-sm">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {getGameName(gameId)}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      第 {round} 轮
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}