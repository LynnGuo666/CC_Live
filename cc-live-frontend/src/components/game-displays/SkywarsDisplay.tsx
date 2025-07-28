'use client';

import { ScorePrediction } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';

interface SkywarsDisplayProps {
  currentGameScore: ScorePrediction;
}

export default function SkywarsDisplay({ currentGameScore }: SkywarsDisplayProps) {
  // Add safety check for team_rankings
  if (!currentGameScore?.team_rankings || !Array.isArray(currentGameScore.team_rankings)) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">☁️</div>
            <div className="font-medium">等待游戏数据...</div>
          </div>
        </div>
      </div>
    );
  }
  
  const sortedTeams = [...currentGameScore.team_rankings].sort((a, b) => a.rank - b.rank);
  
  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 前三名大显示 */}
          {sortedTeams.slice(0, 3).map((team, index) => {
            const teamColor = TEAM_COLORS[team.team_id] || '#808080';
            const teamName = TEAM_NAMES[team.team_id] || team.team_id;
            
            return (
              <div
                key={team.team_id}
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{ 
                  background: `linear-gradient(135deg, ${teamColor}20 0%, ${teamColor}05 100%)`
                }}
              >
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl ${
                  index === 0 ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' :
                  index === 1 ? 'bg-gray-400 shadow-lg shadow-gray-400/30' :
                  'bg-amber-600 shadow-lg shadow-amber-600/30'
                }`}>
                  {team.rank}
                </div>
                <div className="font-bold text-xl text-gray-900 mb-2">{teamName}</div>
                <div className="text-3xl font-bold mb-2" style={{ color: teamColor }}>
                  {team.total_score}
                </div>
                <div className="text-sm text-gray-600">
                  {Object.keys(team.players).length} 选手存活
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 其余队伍 */}
        {sortedTeams.length > 3 && (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {sortedTeams.slice(3).map((team) => {
              const teamColor = TEAM_COLORS[team.team_id] || '#808080';
              const teamName = TEAM_NAMES[team.team_id] || team.team_id;
              
              return (
                <div
                  key={team.team_id}
                  className="bg-white rounded-lg p-3 border text-center"
                  style={{ borderColor: `${teamColor}40` }}
                >
                  <div className="text-sm font-medium text-gray-900">{teamName}</div>
                  <div className="text-lg font-bold" style={{ color: teamColor }}>
                    {team.total_score}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}