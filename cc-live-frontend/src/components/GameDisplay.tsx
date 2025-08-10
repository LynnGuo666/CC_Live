'use client';

import { GameStatus, ScorePrediction, VoteData, BingoCard, RunawayWarriorSummary, GAME_NAMES } from '@/types/tournament';
import { APP_CONFIG } from '@/config/appConfig';

// Import game-specific displays
import BingoDisplay from './game-displays/BingoDisplay';
import BattleBoxDisplay from './game-displays/BattleBoxDisplay';
import SkywarsDisplay from './game-displays/SkywarsDisplay';
import DefaultGameDisplay from './game-displays/DefaultGameDisplay';
import RunawayWarriorDisplay from './game-displays/RunawayWarriorDisplay';

// Import status-specific displays
import VotingGameDisplay from './game-displays/VotingGameDisplay';
import HalfingDisplay from './game-displays/HalfingDisplay';
import SettingDisplay from './game-displays/SettingDisplay';
import FinishedDisplay from './game-displays/FinishedDisplay';

interface GameDisplayProps {
  gameStatus: GameStatus | null;
  currentGameScore: ScorePrediction | null;
  voteData?: VoteData | null;
  bingoCard?: BingoCard | null;
  runawayWarrior?: RunawayWarriorSummary | null;
  className?: string;
}

export default function GameDisplay({ gameStatus, currentGameScore, voteData, bingoCard, runawayWarrior, className = "" }: GameDisplayProps) {
  
  // If no game status, show nothing or default content
  if (!gameStatus) {
    return (
      <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full overflow-hidden ${className}`}>
        {renderFallbackCard({ title: '等待游戏状态...' })}
      </div>
    );
  }

  // Handle different game states
  switch (gameStatus.status) {
    case 'waiting':
      return (
        <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full overflow-hidden ${className}`}>
          {renderFallbackCard({ title: '等待游戏数据中...' })}
        </div>
      );
    
    case 'voting':
      return <VotingGameDisplay voteData={voteData || null} className={className} />;
    
    case 'halfing':
      return <HalfingDisplay className={className} />;
    
    case 'setting':
      return <SettingDisplay className={className} />;
    
    case 'finished':
      return <FinishedDisplay className={className} />;
    
    case 'gaming':
      // 优先在 Bingo 游戏下展示卡片，即使还没有比分预测
      if (!currentGameScore) {
        const gameName = gameStatus.game?.name || '';
        const isBingo = gameName === 'bingo' || gameName === GAME_NAMES['bingo'];
        if (isBingo && bingoCard) {
          return (
            <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full overflow-hidden ${className}`}>
              <BingoDisplay currentGameScore={null} bingoCard={bingoCard} />
            </div>
          );
        }

        return (
          <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full overflow-hidden ${className}`}>
            {renderFallbackCard({ title: '加载游戏数据中…' })}
          </div>
        );
      }

      return (
        <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex flex-col h-full overflow-hidden ${className}`}>
          {renderGameContent(currentGameScore, bingoCard, runawayWarrior)}
        </div>
      );
      
    default:
      return <div className={`${className} flex items-center justify-center text-gray-500`}>
        <div className="text-center">
          <div className="text-2xl">❓</div>
          <div>未知状态</div>
        </div>
      </div>;
  }
}

// Render different game displays based on game type
function renderGameContent(currentGameScore: ScorePrediction, bingoCard?: BingoCard | null, runawayWarrior?: RunawayWarriorSummary | null) {
  switch (currentGameScore.game_id) {
    case 'bingo':
      return <BingoDisplay currentGameScore={currentGameScore} bingoCard={bingoCard} />;
    case 'battle_box':
      return <BattleBoxDisplay currentGameScore={currentGameScore} />;
    case 'skywars':
      return <SkywarsDisplay currentGameScore={currentGameScore} />;
    case 'runaway_warrior':
      return <RunawayWarriorDisplay currentGameScore={currentGameScore} summary={runawayWarrior || null} />;
    default:
      return <DefaultGameDisplay currentGameScore={currentGameScore} />;
  }
}

function renderFallbackCard({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎮</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <div>开发者：<span className="font-medium text-gray-800">Venti_Lynn</span></div>
            <div>
              访问：联合锦标赛官网查看选手数据
              {' '}
              <a className="text-blue-600 hover:underline break-all" href="https://cc.ziip.space" target="_blank" rel="noreferrer">https://cc.ziip.space</a>
            </div>
            <div>
              <a className="text-blue-600 hover:underline break-all" href={APP_CONFIG.blogUrl} target="_blank" rel="noreferrer">查看我的博客</a>
            </div>
            <div className="text-xs text-gray-400">{APP_CONFIG.version}</div>
          </div>
        </div>
      </div>
    </div>
  );
}