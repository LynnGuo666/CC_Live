'use client';

interface WaitingDisplayProps {
  className?: string;
}

export default function WaitingDisplay({ className = "" }: WaitingDisplayProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500 p-8">
        <div className="text-6xl mb-4">⏳</div>
        <div className="text-xl font-medium mb-2">等待游戏开始</div>
        <div className="text-sm text-gray-400">游戏画面将在这里显示</div>
      </div>
    </div>
  );
}