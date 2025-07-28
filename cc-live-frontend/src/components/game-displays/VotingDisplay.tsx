'use client';

interface VotingDisplayProps {
  className?: string;
}

export default function VotingDisplay({ className = "" }: VotingDisplayProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500 p-8">
        <div className="text-6xl mb-4">🗳️</div>
      </div>
    </div>
  );
}