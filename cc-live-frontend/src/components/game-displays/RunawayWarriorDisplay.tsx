'use client';

import { ScorePrediction, RunawayWarriorSummary } from '@/types/tournament';
import { useState } from 'react';

interface RunawayWarriorDisplayProps {
  currentGameScore: ScorePrediction;
  summary?: RunawayWarriorSummary | null;
  className?: string;
}

export default function RunawayWarriorDisplay({ currentGameScore, summary, className = '' }: RunawayWarriorDisplayProps) {
  const [activeModal, setActiveModal] = useState<ModalState | null>(null);

  if (!currentGameScore) {
    return <div className="p-6 text-gray-500">等待游戏数据...</div>;
  }

  const checkpoints = summary?.checkpoints || {};
  const completion = summary?.completion || { ez: 0, mid: 0, hard: 0 };

  const lanes = buildLanesFromSummary(summary);

  function aggregateCountsForLanes(lanes: Array<{ label: string; nodes: string[] }>, s?: RunawayWarriorSummary | null): Record<string, number> {
    const result: Record<string, number> = {};
    const cps = s?.checkpoints || {};
    // 列表页仅展示关卡：将 mainX 和 subY 聚合为该关卡下所有检查点的总通过人数
    lanes.forEach(l => {
      l.nodes.forEach(node => {
        const prefix = node.split('-')[0];
        const keys = (s?.order || Object.keys(cps)).filter(k => k.startsWith(prefix));
        if (keys.length > 0) {
          result[node] = keys.reduce((sum, k) => sum + (cps[k]?.count || 0), 0);
        } else {
          result[node] = cps[node]?.count || 0;
        }
      });
    });
    return result;
  }

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
          aggregateCounts={aggregateCountsForLanes(lanes, summary)}
          onNodeClick={(name) => {
            // 结局节点：展示完成玩家
            if (name === 'fin1' || name === 'fin2' || name === 'fin3') {
              const map: Record<'fin1' | 'fin2' | 'fin3', 'ez' | 'mid' | 'hard'> = { fin1: 'ez', fin2: 'mid', fin3: 'hard' };
              const key = map[name as 'fin1' | 'fin2' | 'fin3'];
              const players = (summary && (summary as unknown as { completionPlayers?: Record<'ez' | 'mid' | 'hard', string[]> }).completionPlayers?.[key]) || [];
              setActiveModal({ mode: 'players', title: `${name} 完成名单`, players });
              return;
            }
            // 关卡点击：展开该关卡下所有检查点（summary.order 中以该关卡开头的项）
            const details: Array<{ name: string; count: number; players: string[] }> = [];
            const prefix = name.split('-')[0]; // main0 / sub1
            const allKeys = (summary?.order || []).filter(k => k.startsWith(prefix));
            if (allKeys.length === 0) {
              // 若没有细粒度检查点，则回退为按节点玩家
              const players = checkpoints[name]?.players || [];
              setActiveModal({ mode: 'players', title: `${name} 通过名单`, players });
              return;
            }
            allKeys.forEach(k => {
              const entry = checkpoints[k] || { count: 0, players: [] as string[] };
              details.push({ name: k, count: entry.count || 0, players: entry.players || [] });
            });
            setActiveModal({ mode: 'checkpoints', title: `${name} 检查点明细`, details });
          }}
        />

        {/* Modal: 显示节点通过玩家 */}
        {activeModal && (
          <CheckpointPlayersModal 
            modal={activeModal}
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

  // 若有后端提供的顺序，则按真实检查点渲染，否则回退固定模板
  if (summary && Array.isArray(summary.order) && summary.order.length > 0) {
    const order = summary.order;
    const mainNodes = order.filter(k => k.startsWith('main') || k.startsWith('fin'));
    if (mainNodes.length > 0) {
      lanes.push({ label: '主线', nodes: mainNodes });
    }

    // 自动发现支线编号，按 sub1..subN 分组
    const subIds = Array.from(new Set(order
      .filter(k => k.startsWith('sub'))
      .map(k => k.match(/^sub(\d+)/)?.[1])
      .filter((v): v is string => !!v)));
    subIds.sort((a, b) => Number(a) - Number(b));
    subIds.forEach(id => {
      const nodes = order.filter(k => k.startsWith(`sub${id}`));
      if (nodes.length > 0) {
        lanes.push({ label: `支线${id}`, nodes });
      }
    });

    return lanes;
  }

  // Fallback：固定模板
  const fallbackMain = [
    'main0-1','main0-2','main0-3',
    'main1-1','main1-2','main1-3',
    'main2-1','main2-2','main2-3',
    'main3-1','main3-2','main3-3',
    'main4-1','main4-2','main4-3',
    'main5-1','main5-2','main5-3',
    'fin1','fin2','fin3'
  ];
  lanes.push({ label: '主线', nodes: fallbackMain });

  for (let i = 1; i <= 5; i++) {
    lanes.push({ label: `支线${i}`, nodes: [`sub${i}-1`, `sub${i}-2`, `sub${i}-3`] });
  }
  return lanes;
}

interface RunawayGraphProps {
  lanes: Array<{ label: string; nodes: string[] }>;
  aggregateCounts: Record<string, number>;
  onNodeClick?: (name: string) => void;
}

function RunawayGraph({ lanes, aggregateCounts, onNodeClick }: RunawayGraphProps) {
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
                    <CheckpointBubble name={node} count={aggregateCounts[node] || 0} onClick={() => onNodeClick?.(node)} />
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

type ModalState =
  | { mode: 'players'; title: string; players: string[] }
  | { mode: 'checkpoints'; title: string; details: Array<{ name: string; count: number; players: string[] }> };

function CheckpointPlayersModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-gray-900">{modal.title}</div>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        {modal.mode === 'players' ? (
          <div className="p-4 space-y-2">
            {modal.players.length === 0 ? (
              <div className="text-sm text-gray-500">暂无玩家</div>
            ) : (
              modal.players.map((p) => (
                <div key={p} className="px-3 py-2 border rounded-lg bg-gray-50">{p}</div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {modal.details.map((d) => (
              <div key={d.name} className="border rounded-lg">
                <div className="px-3 py-2 flex items-center justify-between bg-gray-50 rounded-t-lg">
                  <div className="font-medium text-gray-900">{d.name}</div>
                  <div className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">{d.count}</div>
                </div>
                <div className="p-3 space-y-1">
                  {d.players.length === 0 ? (
                    <div className="text-sm text-gray-400">暂无玩家通过</div>
                  ) : (
                    d.players.map((p) => (
                      <div key={p} className="px-2 py-1 rounded bg-white border text-sm">{p}</div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


