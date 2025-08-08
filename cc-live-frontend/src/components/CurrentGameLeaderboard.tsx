'use client';

import { useState } from 'react';
import { ScorePrediction, GameStatus } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES, GAME_NAMES } from '@/types/tournament';

interface CurrentGameLeaderboardProps {
  currentGameScore: ScorePrediction | null;
  gameStatus: GameStatus | null;
  className?: string;
}

export default function CurrentGameLeaderboard({ currentGameScore, gameStatus, className = "" }: CurrentGameLeaderboardProps) {
  const [viewMode, setViewMode] = useState<'team' | 'player'>('team');

  if (!currentGameScore) {
    return (
      <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full relative ${className}`}>
        <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">当前游戏积分榜</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">🎮</div>
            <div className="font-medium">等待游戏开始...</div>
          </div>
        </div>
      </div>
    );
  }

  const gameName = GAME_NAMES[currentGameScore.game_id] || currentGameScore.game_id;
  // 使用后端提供的tournament_number，如果没有或为0则不显示项目编号
  const gameNumber = gameStatus?.game?.tournament_number || 0;

  // Sort teams by rank
  const sortedTeams = currentGameScore?.team_rankings && Array.isArray(currentGameScore.team_rankings) 
    ? [...currentGameScore.team_rankings].sort((a, b) => a.rank - b.rank)
    : [];

  // Get all players sorted by score
  const allPlayers = sortedTeams
    .flatMap(team => 
      Object.entries(team.players || {}).map(([playerName, score]) => ({
        player: playerName,
        score,
        team: team.team_id,
        teamColor: TEAM_COLORS[team.team_id] || '#808080',
        teamRank: team.rank
      }))
    )
    .sort((a, b) => b.score - a.score);

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full relative ${className}`}>
      <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">当前游戏积分榜</h2>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('team')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === 'team'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              团队
            </button>
            <button
              onClick={() => setViewMode('player')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === 'player'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              个人
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-[88px] bottom-0 left-0 right-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {viewMode === 'team' ? (
            <div className="p-6 space-y-4">
              {sortedTeams.map((team) => {
                const teamColor = TEAM_COLORS[team.team_id] || '#808080';
                const teamName = TEAM_NAMES[team.team_id] || team.team_id;
                const playerCount = Object.keys(team.players).length;
                
                return (
                  <div
                    key={team.team_id}
                    className="group relative bg-white/50 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${teamColor}15 0%, transparent 100%)`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white shadow-sm ${
                            team.rank === 1 ? 'bg-yellow-500' :
                            team.rank === 2 ? 'bg-gray-400' :
                            team.rank === 3 ? 'bg-amber-600' :
                            'bg-gray-500'
                          }`}
                        >
                          {team.rank}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{teamName}</div>
                            <div className="text-sm text-gray-500">{playerCount} 名选手</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{team.total_score}</div>
                        <div className="text-sm text-gray-500">预估积分</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {allPlayers.map((player, index) => (
                <div
                  key={`${player.team}-${player.player}`}
                  className="group relative bg-white/50 rounded-xl p-3 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${player.teamColor}15 0%, transparent 100%)`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shadow-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: player.teamColor }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{player.player}</div>
                          <div className="text-xs text-gray-500">
                            {TEAM_NAMES[player.team] || player.team} · 队伍排名 #{player.teamRank}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{player.score}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}