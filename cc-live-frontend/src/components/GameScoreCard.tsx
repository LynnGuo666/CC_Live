'use client';

import { ScorePrediction } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES, GAME_NAMES } from '@/types/tournament';

interface GameScoreCardProps {
  gameScore: ScorePrediction;
  compact?: boolean;
}

export default function GameScoreCard({ gameScore, compact = false }: GameScoreCardProps) {
  const getTeamColor = (teamId: string) => {
    return TEAM_COLORS[teamId] || '#666666';
  };

  const getTeamName = (teamId: string) => {
    return TEAM_NAMES[teamId] || teamId;
  };

  const getGameName = (gameId: string) => {
    return GAME_NAMES[gameId] || gameId;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedTeams = [...gameScore.team_rankings].sort((a, b) => a.rank - b.rank);
  const topTeams = compact ? sortedTeams.slice(0, 3) : sortedTeams;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-bold ${compact ? 'text-lg' : 'text-xl'} text-gray-800`}>
            {getGameName(gameScore.game_id)}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>第 {gameScore.round} 轮</span>
            <span>•</span>
            <span>{formatTimestamp(gameScore.timestamp)}</span>
          </div>
        </div>
        
        {!compact && (
          <div className="text-right text-sm text-gray-600">
            <div>已处理事件</div>
            <div className="font-bold text-blue-600">{gameScore.total_events_processed}</div>
          </div>
        )}
      </div>

      {/* Team Rankings */}
      <div className="space-y-2">
        {topTeams.map((team) => (
          <div
            key={team.team_id}
            className={`flex items-center p-3 rounded-lg border-l-4 ${
              team.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-white' : 'bg-gray-50'
            }`}
            style={{ borderLeftColor: getTeamColor(team.team_id) }}
          >
            {/* Rank */}
            <div className={`flex-shrink-0 w-8 text-center font-bold ${
              team.rank <= 3 ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : team.rank === 3 ? '🥉' : `#${team.rank}`}
            </div>

            {/* Team */}
            <div className="flex-grow ml-3">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                  style={{ backgroundColor: getTeamColor(team.team_id) }}
                />
                <span className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-gray-800`}>
                  {getTeamName(team.team_id)}
                </span>
              </div>
              
              {/* Players (only in non-compact mode) */}
              {!compact && Object.keys(team.players).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(team.players)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4) // Show top 4 players
                    .map(([player, score]) => (
                      <span key={player} className="text-xs bg-white px-2 py-1 rounded text-gray-600">
                        {player}: {score}
                      </span>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Score */}
            <div className={`flex-shrink-0 text-right font-bold ${
              team.rank <= 3 ? 'text-yellow-600' : 'text-gray-700'
            } ${compact ? 'text-lg' : 'text-xl'}`}>
              {team.total_score}
            </div>
          </div>
        ))}
      </div>

      {/* Show more indicator for compact mode */}
      {compact && sortedTeams.length > 3 && (
        <div className="text-center text-sm text-gray-500 mt-2">
          还有 {sortedTeams.length - 3} 支队伍...
        </div>
      )}
    </div>
  );
}