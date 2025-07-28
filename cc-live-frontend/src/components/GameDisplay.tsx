'use client';

import { GameStatus, ScorePrediction } from '@/types/tournament';
import { GAME_NAMES, TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';

interface GameDisplayProps {
  gameStatus: GameStatus | null;
  currentGameScore: ScorePrediction | null;
  className?: string;
}

export default function GameDisplay({ gameStatus, currentGameScore, className = "" }: GameDisplayProps) {
  
  if (!gameStatus || gameStatus.status !== 'gaming' || !currentGameScore) {
    return (
      <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 p-8">
          <div className="text-6xl mb-4">🎮</div>
          <div className="text-xl font-medium mb-2">等待游戏开始...</div>
          <div className="text-sm text-gray-400">游戏画面将在这里显示</div>
        </div>
      </div>
    );
  }

  const gameName = GAME_NAMES[currentGameScore.game_id] || currentGameScore.game_id;
  // 使用后端提供的tournament_number，如果没有或为0则不显示项目编号
  const gameNumber = gameStatus?.game?.tournament_number || 0;

  // Render different game displays based on game type
  const renderGameContent = () => {
    switch (currentGameScore.game_id) {
      case 'bingo':
        return <BingoDisplay currentGameScore={currentGameScore} />;
      case 'battle_box':
        return <BattleBoxDisplay currentGameScore={currentGameScore} />;
      case 'skywars':
        return <SkywarsDisplay currentGameScore={currentGameScore} />;
      default:
        return <DefaultGameDisplay currentGameScore={currentGameScore} />;
    }
  };

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-gray-900">
              {gameNumber > 0 ? `第${gameNumber}项：${gameName}` : gameName}
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              第 {currentGameScore.round} 轮
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {currentGameScore.total_events_processed} 个事件已处理
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {renderGameContent()}
      </div>
    </div>
  );
}

// 宾果时速游戏显示
function BingoDisplay({ currentGameScore }: { currentGameScore: ScorePrediction }) {
  const sortedTeams = [...currentGameScore.team_rankings].sort((a, b) => a.rank - b.rank);
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedTeams.slice(0, 8).map((team) => {
          const teamColor = TEAM_COLORS[team.team_id] || '#808080';
          const teamName = TEAM_NAMES[team.team_id] || team.team_id;
          
          return (
            <div
              key={team.team_id}
              className="relative bg-white rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: teamColor,
                background: `linear-gradient(135deg, ${teamColor}10 0%, transparent 100%)`
              }}
            >
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold ${
                  team.rank === 1 ? 'bg-yellow-500' :
                  team.rank === 2 ? 'bg-gray-400' :
                  team.rank === 3 ? 'bg-amber-600' :
                  'bg-gray-500'
                }`}>
                  {team.rank}
                </div>
                <div className="font-bold text-gray-900 mb-1">{teamName}</div>
                <div className="text-2xl font-bold" style={{ color: teamColor }}>
                  {team.total_score}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Object.keys(team.players).length} 选手
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 斗战方框游戏显示
function BattleBoxDisplay({ currentGameScore }: { currentGameScore: ScorePrediction }) {
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

// 空岛乱斗游戏显示
function SkywarsDisplay({ currentGameScore }: { currentGameScore: ScorePrediction }) {
  const sortedTeams = [...currentGameScore.team_rankings].sort((a, b) => a.rank - b.rank);
  
  return (
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
  );
}

// 默认游戏显示
function DefaultGameDisplay({ currentGameScore }: { currentGameScore: ScorePrediction }) {
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