'use client';

import { ScorePrediction } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';

interface DefaultGameDisplayProps {
  currentGameScore: ScorePrediction;
}

export default function DefaultGameDisplay({ currentGameScore }: DefaultGameDisplayProps) {
  const sortedTeams = [...currentGameScore.team_rankings].sort((a, b) => a.rank - b.rank);
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedTeams.map((team) => {
          const teamColor = TEAM_COLORS[team.team_id] || '#808080';
          const teamName = TEAM_NAMES[team.team_id] || team.team_id;
          
          return (
            <div
              key={team.team_id}
              className="bg-white rounded-xl p-4 border-2 text-center"
              style={{ 
                borderColor: teamColor,
                background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)`
              }}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold ${
                team.rank === 1 ? 'bg-yellow-500' :
                team.rank === 2 ? 'bg-gray-400' :
                team.rank === 3 ? 'bg-amber-600' :
                'bg-gray-500'
              }`}>
                {team.rank}
              </div>
              <div className="font-bold text-gray-900 mb-1">{teamName}</div>
              <div className="text-xl font-bold" style={{ color: teamColor }}>
                {team.total_score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}