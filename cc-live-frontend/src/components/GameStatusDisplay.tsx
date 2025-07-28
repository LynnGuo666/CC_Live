'use client';

import { useState, useEffect } from 'react';
import { GameStatus, VoteData } from '@/types/tournament';
import { GAME_NAMES } from '@/types/tournament';

interface GameStatusDisplayProps {
  gameStatus: GameStatus | null;
  currentRound: Record<string, number>;
  voteData?: VoteData | null;
}

export default function GameStatusDisplay({ gameStatus, currentRound, voteData }: GameStatusDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (voteData?.time_remaining) {
      setTimeLeft(voteData.time_remaining);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [voteData?.time_remaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, string> = {
      'gaming': '🎮',
      'waiting': '⏳',
      'voting': '🗳️',
      'halfing': '☕',
      'setting': '⚙️',
      'finished': '🏁'
    };
    return iconMap[status] || '❓';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'gaming': '游戏中',
      'waiting': '等待中',
      'voting': '投票中', 
      'halfing': '休息中',
      'setting': '设置中',
      'finished': '已结束'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string, text: string, accent: string }> = {
      'gaming': { bg: 'bg-green-50', text: 'text-green-800', accent: 'bg-green-500' },
      'waiting': { bg: 'bg-blue-50', text: 'text-blue-800', accent: 'bg-blue-500' },
      'voting': { bg: 'bg-purple-50', text: 'text-purple-800', accent: 'bg-purple-500' },
      'halfing': { bg: 'bg-blue-50', text: 'text-blue-800', accent: 'bg-blue-500' },
      'setting': { bg: 'bg-orange-50', text: 'text-orange-800', accent: 'bg-orange-500' },
      'finished': { bg: 'bg-gray-50', text: 'text-gray-800', accent: 'bg-gray-500' }
    };
    return colorMap[status] || { bg: 'bg-gray-50', text: 'text-gray-800', accent: 'bg-gray-500' };
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg p-6">
      {!gameStatus ? (
        <div className="space-y-6">
          {/* 投票信息 - 当没有游戏状态但有投票数据时显示 */}
          {voteData && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-4">投票统计</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-900">{voteData.total_games}</div>
                    <div className="text-sm text-gray-600">可选游戏</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-900">{voteData.total_tickets}</div>
                    <div className="text-sm text-gray-600">总投票数</div>
                  </div>
                </div>
                
                {voteData.votes.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">投票结果</div>
                    {voteData.votes.map(vote => (
                      <div key={vote.game} className="flex items-center justify-between bg-white/50 rounded-lg px-4 py-2">
                        <span className="font-medium text-gray-900">
                          {GAME_NAMES[vote.game] || vote.game}
                        </span>
                        <span className="text-lg font-bold text-indigo-600">{vote.ticket}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status */}
          <div className="text-center">
            <div className={`inline-flex items-center px-6 py-3 rounded-2xl ${getStatusColor(gameStatus.status).bg} border border-opacity-20`}>
              <span className="text-3xl mr-3">{getStatusIcon(gameStatus.status)}</span>
              <div className="text-left">
                <div className={`text-xl font-bold ${getStatusColor(gameStatus.status).text}`}>
                  {getStatusText(gameStatus.status)}
                </div>
                {gameStatus.status === 'voting' && voteData && timeLeft > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    剩余时间: {formatTime(timeLeft)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Second Card - Only show one additional card based on status/data */}
          {gameStatus.status === 'voting' && voteData && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-4">投票统计</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-900">{voteData.total_games}</div>
                    <div className="text-sm text-gray-600">可选游戏</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-900">{voteData.total_tickets}</div>
                    <div className="text-sm text-gray-600">总投票数</div>
                  </div>
                </div>
                
                {voteData.votes.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">投票结果</div>
                    {voteData.votes.map(vote => (
                      <div key={vote.game} className="flex items-center justify-between bg-white/50 rounded-lg px-4 py-2">
                        <span className="font-medium text-gray-900">
                          {GAME_NAMES[vote.game] || vote.game}
                        </span>
                        <span className="text-lg font-bold text-indigo-600">{vote.ticket}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Round Info - Only show if not voting and has round data */}
          {gameStatus.status !== 'voting' && Object.keys(currentRound).length > 0 && (
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <div className="text-sm font-medium text-gray-600 mb-4 text-center">各游戏进度</div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentRound).map(([gameId, round]) => (
                  <div key={gameId} className="bg-white/70 rounded-xl p-3 text-center">
                    <div className="text-xs font-medium text-gray-600 mb-1 truncate">
                      {GAME_NAMES[gameId] || gameId}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {round}
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