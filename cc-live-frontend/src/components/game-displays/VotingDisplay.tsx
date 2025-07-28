'use client';

interface VotingDisplayProps {
  className?: string;
}

export default function VotingDisplay({ className = "" }: VotingDisplayProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500 p-8">
        <div className="text-6xl mb-4">🗳️</div>
        <div className="text-xl font-medium mb-2">投票进行中</div>
        <div className="text-sm text-gray-400">等待投票结果确定下一个游戏</div>
      </div>
    </div>
  );
}