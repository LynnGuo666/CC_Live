'use client';

interface SettingDisplayProps {
  className?: string;
}

export default function SettingDisplay({ className = "" }: SettingDisplayProps) {
  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500 p-8">
        <div className="text-6xl mb-4">⚙️</div>
        <div className="text-xl font-medium mb-2">游戏设置中</div>
        <div className="text-sm text-gray-400">正在准备下一轮游戏</div>
      </div>
    </div>
  );
}