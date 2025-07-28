'use client';

import { ScorePrediction } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';

interface BattleBoxDisplayProps {
  currentGameScore: ScorePrediction;
}

export default function BattleBoxDisplay({ currentGameScore }: BattleBoxDisplayProps) {
  const sortedTeams = [...currentGameScore.team_rankings].sort((a, b) => a.rank - b.rank);
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 顶部对战队伍 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 text-center">领先队伍</h3>
          {sortedTeams.slice(0, 4).map((team, index) => {
            const teamColor = TEAM_COLORS[team.team_id] || '#808080';
            const teamName = TEAM_NAMES[team.team_id] || team.team_id;
            
            return (
              <div
                key={team.team_id}
                className="flex items-center p-4 rounded-xl border-2"
                style={{ 
                  borderColor: teamColor,
                  background: `linear-gradient(90deg, ${teamColor}15 0%, transparent 100%)`
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-amber-600' :
                  'bg-gray-500'
                }`}>
                  {team.rank}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{teamName}</div>
                  <div className="text-sm text-gray-600">
                    {Object.keys(team.players).length} 名选手参战
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: teamColor }}>
                  {team.total_score}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 积分变化图表占位 */}
        <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div className="font-medium">战况统计</div>
            <div className="text-sm mt-1">实时数据可视化</div>
          </div>
        </div>
      </div>
    </div>
  );
}