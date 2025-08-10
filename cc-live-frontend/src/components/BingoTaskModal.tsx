'use client';

// no need for useState here
import { BingoTask } from '@/types/tournament';

interface BingoTaskModalProps {
  task: BingoTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BingoTaskModal({ task, isOpen, onClose }: BingoTaskModalProps) {
  if (!isOpen || !task) return null;

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

  const getTaskTypeText = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'item': return '物品收集';
      case 'advancement': return '成就解锁';
      case 'statistic': return '统计数据';
      case 'kill': return '击杀任务';
      case 'craft': return '合成任务';
      case 'mine': return '挖掘任务';
      default: return '未知类型';
    }
  };

  const parseAdventureText = (raw?: string): string => {
    if (!raw) return '';
    if (!raw.includes('TextComponentImpl') && !raw.includes('TranslatableComponentImpl')) {
      return raw;
    }
    const resultParts: string[] = [];
    const contentRegex = /content=\"([^\"]*)\"/g;
    let match: RegExpExecArray | null;
    while ((match = contentRegex.exec(raw)) !== null) {
      if (match[1]) resultParts.push(match[1]);
    }
    const keyRegex = /TranslatableComponentImpl\{key=\"([^\"]+)\"/g;
    while ((match = keyRegex.exec(raw)) !== null) {
      if (match[1]) {
        const key = match[1];
        const pretty = key.split('.').pop()?.replace(/_/g, ' ') || key;
        const titled = pretty.replace(/\b\w/g, (c) => c.toUpperCase());
        resultParts.push(titled);
      }
    }
    const result = resultParts.join(' ').replace(/\s+/g, ' ').trim();
    return result || raw;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">任务详情</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Task Icon and Name */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-2">{getTaskTypeIcon(task.type)}</div>
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{task.display_name || parseAdventureText(task.name)}</h4>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {getTaskTypeText(task.type)}
            </span>
          </div>

          {/* Position Info */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h5 className="font-medium text-gray-900 mb-2">位置信息</h5>
            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">坐标:</span>
                <div className="font-mono">({task.x}, {task.y})</div>
              </div>
              <div>
                <span className="text-gray-500">索引:</span>
                <div className="font-mono">{task.index}</div>
              </div>
              <div>
                <span className="text-gray-500">顺序:</span>
                <div className="font-mono">#{task.index + 1}</div>
              </div>
            </div>
          </div>

          {/* Task Description */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h5 className="font-medium text-gray-900 mb-2">任务描述</h5>
              <p className="text-gray-700 whitespace-pre-wrap">{task.display_description || parseAdventureText(task.description)}</p>
          </div>

          {/* AI 建议/来源/难度 */}
          {(task.advice || task.source || task.difficulty) && (
            <div className="bg-white rounded-lg p-3 sm:p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">辅助信息</h5>
              <div className="space-y-2 text-sm">
                {task.advice && (
                  <div>
                    <span className="text-gray-500">建议：</span>
                    <span className="text-gray-800">{task.advice}</span>
                  </div>
                )}
                {task.source && (
                  <div>
                    <span className="text-gray-500">来源：</span>
                    <span className="text-gray-800 break-words">{task.source}</span>
                  </div>
                )}
                {task.difficulty && (
                  <div>
                    <span className="text-gray-500">难度：</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">{task.difficulty}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task Details */}
          {(task.material || task.count) && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h5 className="font-medium text-gray-900 mb-2">任务要求</h5>
              <div className="space-y-2">
                {task.material && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">物品:</span>
                    <span className="font-mono text-gray-900">{task.material}</span>
                  </div>
                )}
                {task.count && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">数量:</span>
                    <span className="font-mono text-gray-900">{task.count}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion Status: 仅在已完成时显示 */}
          {task.completed && (
            <div className="rounded-lg p-4 bg-green-50">
              <h5 className="font-medium text-gray-900 mb-2">完成状态</h5>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium text-green-700">已完成</span>
              </div>
              {task.completedBy && (
                <div className="mt-2 text-sm text-gray-600">
                  <div>完成者: <span className="font-medium">{task.completedBy}</span></div>
                  {task.completedAt && (
                    <div>完成时间: <span className="font-mono">{new Date(task.completedAt).toLocaleString('zh-CN')}</span></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
