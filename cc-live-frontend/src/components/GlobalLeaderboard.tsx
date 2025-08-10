'use client';

import { useState } from 'react';
import { TeamScore } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';

interface GlobalLeaderboardProps {
  globalScores: TeamScore[];
  className?: string;
}

export default function GlobalLeaderboard({ globalScores, className = "" }: GlobalLeaderboardProps) {
  const [viewMode, setViewMode] = useState<'team' | 'player'>('team');

  // Sort teams by total score
  const sortedTeams = [...globalScores].sort((a, b) => b.total_score - a.total_score);

  // Get all players sorted by score
  const allPlayers = globalScores
    .flatMap(team => 
      team.scores.map(player => ({
        ...player,
        team: team.team,
        teamColor: team.color || TEAM_COLORS[team.team] || '#808080'
      }))
    )
    .sort((a, b) => b.score - a.score);

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full relative ${className}`}>
      <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">总积分榜</h2>
          
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
              {sortedTeams.map((team, index) => {
                const teamColor = team.color || TEAM_COLORS[team.team] || '#808080';
                const teamName = TEAM_NAMES[team.team] || team.team;
                
                return (
                  <div
                    key={team.team}
                    className="group relative bg-white/50 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${teamColor}15 0%, transparent 100%)`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: teamColor }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{teamName}</div>
                            <div className="text-sm text-gray-500">{team.player_count} 名选手</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{team.total_score}</div>
                        <div className="text-sm text-gray-500">总积分</div>
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
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://mc-heads.net/avatar/${encodeURIComponent(player.player)}/64`}
                          alt={player.player}
                          className="w-6 h-6 rounded-md shadow-sm border border-gray-200"
                          loading="lazy"
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: player.teamColor }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{player.player}</div>
                          <div className="text-xs text-gray-500">{TEAM_NAMES[player.team] || player.team}</div>
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