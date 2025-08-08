'use client';

import { ScorePrediction, RunawayWarriorSummary } from '@/types/tournament';

interface RunawayWarriorDisplayProps {
  currentGameScore: ScorePrediction;
  summary?: RunawayWarriorSummary | null;
  className?: string;
}

export default function RunawayWarriorDisplay({ currentGameScore, summary, className = '' }: RunawayWarriorDisplayProps) {
  if (!currentGameScore) {
    return <div className="p-6 text-gray-500">等待游戏数据...</div>;
  }

  const checkpoints = summary?.checkpoints || {};
  const order = summary?.order || Object.keys(checkpoints);
  const completion = summary?.completion || { ez: 0, mid: 0, hard: 0 };

  return (
    <div className={`h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${className}`}>
      <div className="p-6 space-y-6">
        {/* 路线完成统计 */}
        <div className="bg-white rounded-xl p-4 border">
          <div className="font-semibold text-gray-900 mb-3">完成路线统计</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="text-sm text-gray-600">简单（EZ）</div>
              <div className="text-2xl font-bold text-green-700">{completion.ez}</div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-sm text-gray-600">中等（MID）</div>
              <div className="text-2xl font-bold text-yellow-700">{completion.mid}</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="text-sm text-gray-600">困难（HARD）</div>
              <div className="text-2xl font-bold text-red-700">{completion.hard}</div>
            </div>
          </div>
        </div>

        {/* 检查点通关展示 */}
        <div className="bg-white rounded-xl p-4 border">
          <div className="font-semibold text-gray-900 mb-3">跑酷检查点</div>

          {/* 主线: main0 - check0/1/2 -> sub1-0/1/2 -> main1 -> ... -> main5 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {order.map((key) => (
              <CheckpointCard key={key} name={key} count={checkpoints[key]?.count || 0} players={checkpoints[key]?.players || []} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CheckpointCardProps {
  name: string;
  count: number;
  players: string[];
}

function CheckpointCard({ name, count, players }: CheckpointCardProps) {
  return (
    <details className="group border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <div className="font-medium text-gray-900">{name}</div>
        <div className="text-sm px-2 py-0.5 rounded-full bg-blue-600 text-white">{count}</div>
      </summary>

      {/* 展开后显示玩家列表 */}
      {players.length > 0 ? (
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          {players.map((p) => (
            <div key={p} className="px-2 py-1 rounded bg-white border">
              {p}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-gray-400">暂无通过</div>
      )}
    </details>
  );
}


