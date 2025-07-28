'use client';

import { TeamRanking, TeamScore } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';

interface LeaderboardProps {
  gameScore?: TeamRanking[] | null;
  globalScores?: TeamScore[];
  title?: string;
  showPlayers?: boolean;
}

export default function Leaderboard({ gameScore, globalScores, title = "积分榜", showPlayers = true }: LeaderboardProps) {
  // Use game score if available, otherwise use global scores
  const scores = gameScore || globalScores?.map(team => ({
    team_id: team.team,
    rank: 0, // Will be calculated
    total_score: team.total_score,
    players: team.scores.reduce((acc, player) => {
      acc[player.player] = player.score;
      return acc;
    }, {} as Record<string, number>)
  })) || [];

  // Sort by total score and assign ranks
  const sortedScores = [...scores]
    .sort((a, b) => b.total_score - a.total_score)
    .map((team, index) => ({
      ...team,
      rank: index + 1
    }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getTeamColor = (teamId: string) => {
    return TEAM_COLORS[teamId] || '#666666';
  };

  const getTeamName = (teamId: string) => {
    return TEAM_NAMES[teamId] || teamId;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{title}</h2>
      
      {sortedScores.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          暂无积分数据
        </div>
      ) : (
        <div className="space-y-3">
          {sortedScores.map((team) => (
            <div
              key={team.team_id}
              className={`flex items-center p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                team.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-white' : 'bg-gray-50'
              }`}
              style={{ borderLeftColor: getTeamColor(team.team_id) }}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                <span className={`text-lg font-bold ${team.rank <= 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {getRankIcon(team.rank)}
                </span>
              </div>

              {/* Team Info */}
              <div className="flex-grow ml-4">
                <div className="flex items-center mb-2">
                  <div
                    className="w-4 h-4 rounded-full mr-3 border border-gray-300"
                    style={{ backgroundColor: getTeamColor(team.team_id) }}
                  />
                  <span className="font-semibold text-lg text-gray-800">
                    {getTeamName(team.team_id)}
                  </span>
                </div>

                {/* Players */}
                {showPlayers && Object.keys(team.players).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {Object.entries(team.players)
                      .sort(([, a], [, b]) => b - a)
                      .map(([player, score]) => (
                        <div key={player} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                          <span className="font-medium">{player}</span>
                          <span className="text-blue-600 ml-1">{score}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Total Score */}
              <div className="flex-shrink-0 text-right">
                <div className={`text-2xl font-bold ${team.rank <= 3 ? 'text-yellow-600' : 'text-gray-700'}`}>
                  {team.total_score}
                </div>
                <div className="text-sm text-gray-500">总分</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}