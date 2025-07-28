'use client';

import { ConnectionStatus } from '@/types/tournament';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
}

export default function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const formatLastPing = (timestamp?: string) => {
    if (!timestamp) return '未知';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}秒前`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}分钟前`;
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        {/* Connection Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            status.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className={`font-semibold ${
            status.connected ? 'text-green-700' : 'text-red-700'
          }`}>
            {status.connected ? '已连接' : '未连接'}
          </span>
          
          {status.client_id && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              ID: {status.client_id.slice(-8)}
            </span>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {status.connection_count !== undefined && (
            <div className="flex items-center space-x-1">
              <span>👥</span>
              <span>{status.connection_count} 人在线</span>
            </div>
          )}
          
          {status.last_ping && (
            <div className="flex items-center space-x-1">
              <span>📡</span>
              <span>心跳: {formatLastPing(status.last_ping)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}