'use client';

import { VoteData } from '@/types/tournament';
import { GAME_NAMES } from '@/types/tournament';

interface VotingDisplayProps {
  voteData: VoteData | null;
}

export default function VotingDisplay({ voteData }: VotingDisplayProps) {
  if (!voteData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">游戏投票</h2>
        <div className="text-center text-gray-500 py-8">
          暂无投票数据
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGameName = (gameId: string) => {
    return GAME_NAMES[gameId] || gameId;
  };

  const sortedVotes = [...voteData.votes].sort((a, b) => b.ticket - a.ticket);
  const maxTickets = Math.max(...voteData.votes.map(v => v.ticket));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">游戏投票</h2>
      
      {/* Voting Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(voteData.time_remaining)}
            </div>
            <div className="text-sm text-gray-600">剩余时间</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {voteData.total_tickets}
            </div>
            <div className="text-sm text-gray-600">总投票数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {voteData.total_games}
            </div>
            <div className="text-sm text-gray-600">候选游戏</div>
          </div>
        </div>
      </div>

      {/* Vote Results */}
      <div className="space-y-4">
        {sortedVotes.map((vote, index) => {
          const percentage = maxTickets > 0 ? (vote.ticket / maxTickets) * 100 : 0;
          const isLeading = index === 0 && vote.ticket > 0;
          
          return (
            <div
              key={vote.game}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isLeading 
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Progress Bar Background */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isLeading ? 'bg-gradient-to-r from-yellow-200 to-orange-200' : 'bg-blue-100'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isLeading ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Game Name */}
                  <div>
                    <h3 className={`font-bold text-lg ${isLeading ? 'text-yellow-900' : 'text-gray-800'}`}>
                      {getGameName(vote.game)}
                    </h3>
                    <p className="text-sm text-gray-600">{vote.game}</p>
                  </div>
                </div>

                {/* Vote Count and Percentage */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isLeading ? 'text-yellow-900' : 'text-gray-700'}`}>
                    {vote.ticket}
                  </div>
                  <div className="text-sm text-gray-600">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Leading indicator */}
              {isLeading && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    🏆 领先
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time Warning */}
      {voteData.time_remaining <= 30 && voteData.time_remaining > 0 && (
        <div className="mt-6 bg-red-100 border border-red-300 rounded-lg p-4 text-center">
          <div className="text-red-700 font-semibold animate-pulse">
            ⚠️ 投票即将结束，仅剩 {formatTime(voteData.time_remaining)} ！
          </div>
        </div>
      )}
    </div>
  );
}