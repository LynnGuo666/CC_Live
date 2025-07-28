'use client';

interface HalfingDisplayProps {
  className?: string;
}

export default function HalfingDisplay({ className = "" }: HalfingDisplayProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500 p-8">
        <div className="text-6xl mb-4">☕</div>
        <div className="text-xl font-medium mb-2">中场休息</div>
        <div className="text-sm text-gray-400">选手们正在休息，游戏即将继续</div>
      </div>
    </div>
  );
}