'use client';

interface FinishedDisplayProps {
  className?: string;
}

export default function FinishedDisplay({ className = "" }: FinishedDisplayProps) {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500 p-6 sm:p-8">
        <div className="text-6xl mb-4">🏁</div>
        <div className="text-xl font-medium mb-2">比赛结束</div>
        <div className="text-sm text-gray-400">感谢观看本次比赛</div>
      </div>
    </div>
  );
}