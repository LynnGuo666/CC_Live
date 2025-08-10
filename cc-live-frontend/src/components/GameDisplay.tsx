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
          <div className="text-sm text-gray-600 space-y-3">
            {/* 顶部信息行：开发者 + 博客 + 版本号 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-gray-700">
              <span className="inline-flex items-center gap-1">
                <span className="text-gray-500">开发者</span>
                <span className="font-medium text-gray-800">Venti_Lynn</span>
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <a className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline" href={APP_CONFIG.blogUrl} target="_blank" rel="noreferrer">
                查看我的博客
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5 4a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 11-2 0V6.414l-8.293 8.293a1 1 0 01-1.414-1.414L12.586 5H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </a>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="text-xs text-gray-400">{APP_CONFIG.version}</span>
            </div>

            {/* 更多链接 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                className="group inline-flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:bg-white hover:shadow-sm transition"
                href={APP_CONFIG.officialSiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>联合锦标赛官网</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-blue-600">
                  <path fillRule="evenodd" d="M5 4a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 11-2 0V6.414l-8.293 8.293a1 1 0 01-1.414-1.414L12.586 5H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </a>

              <a
                className="group inline-flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:bg-white hover:shadow-sm transition break-all"
                href={APP_CONFIG.antiCheatUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>反作弊系统介绍</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-blue-600">
                  <path fillRule="evenodd" d="M5 4a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 11-2 0V6.414l-8.293 8.293a1 1 0 01-1.414-1.414L12.586 5H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}