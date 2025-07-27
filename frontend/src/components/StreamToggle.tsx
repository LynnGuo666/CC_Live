/**
 * 直播模式切换组件
 * 支持在文字直播和B站视频直播之间切换
 */

import React from 'react'
import { Monitor, FileText, ExternalLink, Play } from 'lucide-react'

interface StreamToggleProps {
  streamMode: 'text' | 'video'
  onModeChange: (mode: 'text' | 'video') => void
  bilibiliUrl?: string
  className?: string
}

export const StreamToggle: React.FC<StreamToggleProps> = ({
  streamMode,
  onModeChange,
  bilibiliUrl,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">直播模式</h3>
        
        {bilibiliUrl && (
          <a
            href={bilibiliUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-600 flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span>在B站观看</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 文字直播模式 */}
        <button
          onClick={() => onModeChange('text')}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
            ${streamMode === 'text' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }
          `}
        >
          <FileText className="w-8 h-8 mb-2" />
          <span className="font-medium">文字直播</span>
          <span className="text-xs opacity-75 mt-1">实时事件流</span>
        </button>

        {/* 视频直播模式 */}
        <button
          onClick={() => onModeChange('video')}
          disabled={!bilibiliUrl}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
            ${streamMode === 'video' 
              ? 'border-red-500 bg-red-50 text-red-700' 
              : bilibiliUrl 
                ? 'border-gray-200 hover:border-gray-300 text-gray-600'
                : 'border-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Monitor className="w-8 h-8 mb-2" />
          <span className="font-medium">视频直播</span>
          <span className="text-xs opacity-75 mt-1">
            {bilibiliUrl ? 'B站直播间' : '暂无视频源'}
          </span>
        </button>
      </div>

      {/* 当前模式说明 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {streamMode === 'text' ? (
            <>
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">当前: 文字直播模式</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-900">当前: 视频直播模式</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {streamMode === 'text' 
            ? '查看实时游戏事件、玩家数据和排行榜' 
            : '观看B站高清视频直播'
          }
        </p>
      </div>
    </div>
  )
}