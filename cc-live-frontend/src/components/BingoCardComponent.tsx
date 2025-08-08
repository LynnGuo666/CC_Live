'use client';

import { useState } from 'react';
import { BingoCard, BingoTask } from '@/types/tournament';
import { TEAM_COLORS, TEAM_NAMES } from '@/types/tournament';
import BingoTaskModal from './BingoTaskModal';

interface BingoCardProps {
  bingoCard: BingoCard;
  className?: string;
}

export default function BingoCardComponent({ bingoCard, className = '' }: BingoCardProps) {
  const [selectedTask, setSelectedTask] = useState<BingoTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: BingoTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'item': return '📦';
      case 'advancement': return '🏆';
      case 'statistic': return '📊';
      case 'kill': return '⚔️';
      case 'craft': return '🔨';
      case 'mine': return '⛏️';
      default: return '❓';
    }
  };

  // 解析 Adventure TextComponent 的 toString 文本为可读字符串
  const parseAdventureText = (raw?: string): string => {
    if (!raw) return '';
    // 若原本就是普通字符串，直接返回
    if (!raw.includes('TextComponentImpl') && !raw.includes('TranslatableComponentImpl')) {
      return raw;
    }
    let resultParts: string[] = [];
    // 抽取所有 content="..." 的文本
    const contentRegex = /content=\"([^\"]*)\"/g;
    let match: RegExpExecArray | null;
    while ((match = contentRegex.exec(raw)) !== null) {
      if (match[1]) resultParts.push(match[1]);
    }
    // 抽取可翻译 key，例如 block.minecraft.soul_sand
    const keyRegex = /TranslatableComponentImpl\{key=\"([^\"]+)\"/g;
    while ((match = keyRegex.exec(raw)) !== null) {
      if (match[1]) {
        const key = match[1];
        const pretty = key.split('.').pop()?.replace(/_/g, ' ') || key;
        // 首字母大写
        const titled = pretty.replace(/\b\w/g, (c) => c.toUpperCase());
        resultParts.push(titled);
      }
    }
    const result = resultParts.join(' ').replace(/\s+/g, ' ').trim();
    return result || raw; // 兜底返回原始
  };

  // 根据坐标排序任务
  const getSortedTasks = (): BingoTask[] => {
    const tasks: BingoTask[] = [];
    for (let y = 0; y < bingoCard.height; y++) {
      for (let x = 0; x < bingoCard.width; x++) {
        const key = `${x},${y}`;
        if (bingoCard.tasks[key]) {
          tasks.push(bingoCard.tasks[key]);
        }
      }
    }
    return tasks;
  };

  const teamColor = bingoCard.team ? TEAM_COLORS[bingoCard.team.color] || '#808080' : '#808080';
  const teamName = bingoCard.team ? TEAM_NAMES[bingoCard.team.color] || bingoCard.team.name : '共享卡片';

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="px-6 py-4 text-white"
        style={{ backgroundColor: teamColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{teamName}</h3>
            <div className="text-sm opacity-90">
              {bingoCard.team ? `${bingoCard.team.completeCount} 个已完成` : `${bingoCard.width}×${bingoCard.height} 卡片`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">🎯</div>
            <div className="text-xs opacity-75">宾果卡片</div>
          </div>
        </div>
        
        {/* Team Members */}
        {bingoCard.team && bingoCard.team.members && (
          <div className="mt-3 flex flex-wrap gap-1">
            {Object.entries(bingoCard.team.members).map(([playerId, player]) => (
              <span 
                key={playerId}
                className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs"
              >
                {player.displayName}
                {player.alwaysActive && ' ⭐'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bingo Grid */}
      <div className="p-6">
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${bingoCard.width}, 1fr)`,
            aspectRatio: `${bingoCard.width} / ${bingoCard.height}`
          }}
        >
          {getSortedTasks().map((task) => (
            <button
              key={`${task.x}-${task.y}`}
              onClick={() => handleTaskClick(task)}
              className={`
                relative aspect-square rounded-lg border-2 p-2 transition-all duration-200 hover:scale-105 hover:shadow-md
                flex flex-col items-center justify-center text-center
                ${task.completed 
                  ? 'bg-green-100 border-green-400 text-green-800' 
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {/* Task Icon */}
              <div className="text-lg mb-1">{getTaskTypeIcon(task.type)}</div>
              
              {/* Task Name */}
              <div className="text-xs font-medium leading-tight overflow-hidden line-clamp-2">
                {parseAdventureText(task.name)}
              </div>
              
              {/* Count indicator */}
              {task.count && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {task.count > 9 ? '9+' : task.count}
                </div>
              )}
              
              {/* Completion indicator */}
              {task.completed && (
                <div className="absolute top-1 left-1 text-green-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Position indicator */}
              <div className="absolute bottom-0 right-0 text-xs opacity-50 font-mono">
                {task.x},{task.y}
              </div>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        {bingoCard.team && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>完成进度</span>
              <span>{bingoCard.team.completeCount} / {bingoCard.size}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(bingoCard.team.completeCount / bingoCard.size) * 100}%`,
                  backgroundColor: teamColor
                }}
              />
            </div>
          </div>
        )}

        {/* Card Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-900">{bingoCard.size}</div>
              <div>总任务数</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{bingoCard.width}×{bingoCard.height}</div>
              <div>卡片尺寸</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {new Date(bingoCard.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
              <div>更新时间</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <BingoTaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
