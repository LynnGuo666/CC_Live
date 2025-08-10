'use client';

import { ScorePrediction, RunawayWarriorSummary } from '@/types/tournament';
import { useMemo, useState } from 'react';

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
  const completion = summary?.completion || { ez: 0, mid: 0, hard: 0 };

  const [activeModal, setActiveModal] = useState<{ title: string; players: string[] } | null>(null);

  const lanes = buildLanesFromSummary(summary);

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

        {/* 跑酷路线图 */}
        <RunawayGraph 
          lanes={lanes} 
          checkpoints={checkpoints} 
          onNodeClick={(name) => {
            // 结局节点：用 completionPlayers
            if (name === 'fin1' || name === 'fin2' || name === 'fin3') {
              const map: Record<'fin1' | 'fin2' | 'fin3', 'ez' | 'mid' | 'hard'> = {
                fin1: 'ez', fin2: 'mid', fin3: 'hard'
              };
              const key = map[name as 'fin1' | 'fin2' | 'fin3'];
              const players = (summary as any)?.completionPlayers?.[key] || [];
              setActiveModal({ title: `${name} 完成名单`, players });
              return;
            }
            // 普通检查点：来自 checkpoints
            const players = checkpoints[name]?.players || [];
            setActiveModal({ title: `${name} 通过名单`, players });
          }}
        />

        {/* Modal: 显示节点通过玩家 */}
        {activeModal && (
          <CheckpointPlayersModal 
            title={activeModal.title}
            players={activeModal.players}
            onClose={() => setActiveModal(null)}
          />
        )}
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

// 构建图的泳道：
// 主线: main0 -> main1 -> ... -> main5 -> fin1 fin2 fin3
// 子线: sub{i}-0/1/2 放在 main{i} 与 main{i+1} 之间
function buildLanesFromSummary(summary?: RunawayWarriorSummary | null) {
  const lanes: Array<{ label: string; nodes: string[] }> = [];
  // 主线：每段 1/2/3（3 为完成），fin1/fin2/fin3 作为结局
  const mainNodes = [
    'main0-1','main0-2','main0-3',
    'main1-1','main1-2','main1-3',
    'main2-1','main2-2','main2-3',
    'main3-1','main3-2','main3-3',
    'main4-1','main4-2','main4-3',
    'main5-1','main5-2','main5-3',
    'fin1','fin2','fin3'
  ];
  lanes.push({ label: '主线', nodes: mainNodes });

  // 支线 sub1..sub5，每段 1/2/3，且在对应 mainN 之前右手侧
  for (let i = 0; i < 5; i++) {
    const laneLabel = `支线${i + 1}`;
    const nodes = [`sub${i + 1}-1`, `sub${i + 1}-2`, `sub${i + 1}-3`];
    lanes.push({ label: laneLabel, nodes });
  }

  return lanes;
}

interface RunawayGraphProps {
  lanes: Array<{ label: string; nodes: string[] }>;
  checkpoints: Record<string, { count: number; players: string[] }>;
  onNodeClick?: (name: string) => void;
}

function RunawayGraph({ lanes, checkpoints, onNodeClick }: RunawayGraphProps) {
  return (
    <div className="bg-white rounded-xl p-4 border">
      <div className="font-semibold text-gray-900 mb-3">跑酷路线图</div>
      <div className="space-y-4">
        {lanes.map((lane) => (
          <div key={lane.label} className="flex items-center">
            <div className="w-16 text-xs text-gray-600 flex-shrink-0 text-right pr-2">{lane.label}</div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-2">
                {lane.nodes.map((node, idx) => (
                  <div key={node} className="flex items-center gap-2">
                    <CheckpointBubble name={node} count={checkpoints[node]?.count || 0} onClick={() => onNodeClick?.(node)} />
                    {idx < lane.nodes.length - 1 && <div className="h-0.5 w-6 bg-gray-300" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckpointBubble({ name, count, onClick }: { name: string; count: number; onClick?: () => void }) {
  const isMain = name.startsWith('main') || name.startsWith('fin');
  const color = isMain ? 'bg-blue-600' : 'bg-purple-600';
  return (
    <div className="relative">
      <button onClick={onClick} className={`h-8 rounded-full px-3 text-white text-xs font-medium flex items-center justify-center ${color} hover:brightness-110 active:scale-95 transition`}>
        {name}
      </button>
      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-1 py-0.5 rounded">
        {count}
      </div>
    </div>
  );
}

function CheckpointPlayersModal({ title, players, onClose }: { title: string; players: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-gray-900">{title}</div>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-2">
          {players.length === 0 ? (
            <div className="text-sm text-gray-500">暂无玩家通过</div>
          ) : (
            players.map((p) => (
              <div key={p} className="px-3 py-2 border rounded-lg bg-gray-50">{p}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


