import React, { useEffect, useState } from 'react';
import { Timer as TimerIcon, AlertCircle } from 'lucide-react';

interface InterviewTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isRunning?: boolean;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  initialSeconds,
  onTimeUp,
  isRunning = true,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 120; // less than 2 mins

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border font-mono text-sm font-bold shadow-xs transition-colors ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
          : 'bg-white text-slate-800 border-slate-200'
      }`}
    >
      <TimerIcon className={`w-4 h-4 ${isUrgent ? 'text-rose-600' : 'text-slate-500'}`} />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isUrgent && <AlertCircle className="w-4 h-4 text-rose-600" />}
    </div>
  );
};
