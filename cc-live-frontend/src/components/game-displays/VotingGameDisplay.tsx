'use client';

import { VoteData } from '@/types/tournament';
import { GAME_NAMES } from '@/types/tournament';

interface VotingGameDisplayProps {
  voteData: VoteData | null;
  className?: string;
}

export default function VotingGameDisplay({ voteData, className = "" }: VotingGameDisplayProps) {
  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col ${className}`}>
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent p-3 sm:p-6">
          <div className="flex items-center justify-center h-full min-h-0">
            {voteData ? (
              <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🗳️</div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="text-center">
                    {voteData.votes.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-lg font-medium text-gray-700">投票结果</div>
                        {voteData.votes
                          .sort((a, b) => b.ticket - a.ticket)
                          .map(vote => (
                          <div key={vote.game} className="flex items-center justify-between bg-white/70 rounded-lg px-6 py-4">
                            <span className="text-lg font-medium text-gray-900">
                              {GAME_NAMES[vote.game] || vote.game}
                            </span>
                            <span className="text-2xl font-bold text-indigo-600">{vote.ticket}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🗳️</div>
                <div className="text-gray-400">等待投票数据...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}