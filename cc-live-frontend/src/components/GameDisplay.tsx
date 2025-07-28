'use client';

import { GameStatus, ScorePrediction } from '@/types/tournament';
import { GAME_NAMES } from '@/types/tournament';

// Import game-specific displays
import BingoDisplay from './game-displays/BingoDisplay';
import BattleBoxDisplay from './game-displays/BattleBoxDisplay';
import SkywarsDisplay from './game-displays/SkywarsDisplay';
import DefaultGameDisplay from './game-displays/DefaultGameDisplay';

// Import status-specific displays
import WaitingDisplay from './game-displays/WaitingDisplay';
import VotingDisplay from './game-displays/VotingDisplay';
import HalfingDisplay from './game-displays/HalfingDisplay';
import SettingDisplay from './game-displays/SettingDisplay';
import FinishedDisplay from './game-displays/FinishedDisplay';

interface GameDisplayProps {
  gameStatus: GameStatus | null;
  currentGameScore: ScorePrediction | null;
  className?: string;
}

export default function GameDisplay({ gameStatus, currentGameScore, className = "" }: GameDisplayProps) {
  
  // If no game status, show waiting
  if (!gameStatus) {
    return <WaitingDisplay className={className} />;
  }

  // Handle different game states
  switch (gameStatus.status) {
    case 'waiting':
      return <WaitingDisplay className={className} />;
    
    case 'voting':
      return <VotingDisplay className={className} />;
    
    case 'halfing':
      return <HalfingDisplay className={className} />;
    
    case 'setting':
      return <SettingDisplay className={className} />;
    
    case 'finished':
      return <FinishedDisplay className={className} />;
    
    case 'gaming':
      // Show game content if we have score data
      if (!currentGameScore) {
        return <WaitingDisplay className={className} />;
      }

      const gameName = GAME_NAMES[currentGameScore.game_id] || currentGameScore.game_id;
      const gameNumber = gameStatus?.game?.tournament_number || 0;

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
            {renderGameContent(currentGameScore)}
          </div>
        </div>
      );
      
    default:
      return <WaitingDisplay className={className} />;
  }
}

// Render different game displays based on game type
function renderGameContent(currentGameScore: ScorePrediction) {
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
}