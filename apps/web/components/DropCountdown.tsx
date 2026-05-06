'use client';

import { useEffect, useState } from 'react';
import { Clock, Lock, Unlock } from 'lucide-react';

interface DropCountdownProps {
  initialServerTime: number; // Timestamp
}

type DropState = 'upcoming' | 'gold_access' | 'public_live' | 'closed';

export default function DropCountdown({ initialServerTime }: DropCountdownProps) {
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [dropState, setDropState] = useState<DropState>('upcoming');

  useEffect(() => {
    // Calculate offset between client and server time
    const now = Date.now();
    setServerTimeOffset(initialServerTime - now);
  }, [initialServerTime]);

  useEffect(() => {
    const calculateState = () => {
      const nowTimestamp = Date.now() + serverTimeOffset;
      const now = new Date(nowTimestamp);
      const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, etc.
      const hour = now.getHours();

      // Logic for Weekly Drop:
      // Gold Access: Tuesday 8 AM - 6 PM
      // Public Access: Wednesday 5 AM - 6 PM
      
      let currentState: DropState = 'upcoming';
      let targetDate = new Date(now);

      if (day === 2) { // Tuesday
        if (hour >= 8 && hour < 18) {
          currentState = 'gold_access';
          targetDate.setHours(18, 0, 0, 0); // Ends at 6 PM
        } else if (hour < 8) {
          currentState = 'upcoming';
          targetDate.setHours(8, 0, 0, 0); // Starts at 8 AM
        } else {
          // After 6 PM Tuesday -> Wait for Wednesday 5 AM
          currentState = 'closed';
          targetDate.setDate(now.getDate() + 1);
          targetDate.setHours(5, 0, 0, 0);
        }
      } else if (day === 3) { // Wednesday
        if (hour >= 5 && hour < 18) {
          currentState = 'public_live';
          targetDate.setHours(18, 0, 0, 0); // Ends at 6 PM
        } else if (hour < 5) {
          currentState = 'upcoming'; // Or 'closed' waiting for 5 AM
          targetDate.setHours(5, 0, 0, 0);
        } else {
          // After 6 PM Wednesday -> Closed until next Tuesday
          currentState = 'closed';
          const daysUntilTuesday = 6; // Wed(3) -> Tue(2) = 6 days
          targetDate.setDate(now.getDate() + daysUntilTuesday);
          targetDate.setHours(8, 0, 0, 0);
        }
      } else {
        // Other days -> Closed until next Tuesday
        currentState = 'closed';
        const daysUntilTuesday = day < 2 ? 2 - day : 7 - day + 2;
        targetDate.setDate(now.getDate() + daysUntilTuesday);
        targetDate.setHours(8, 0, 0, 0);
      }

      setDropState(currentState);

      const distance = targetDate.getTime() - nowTimestamp;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateState();
    const timer = setInterval(calculateState, 1000);

    return () => clearInterval(timer);
  }, [serverTimeOffset]);

  if (dropState === 'public_live') {
    return (
      <div className="bg-red-600 text-white py-3 text-center border-b border-red-700 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <Unlock className="w-4 h-4" />
          <p className="text-xs md:text-sm font-black tracking-widest uppercase">
            DROP IS LIVE • PUBLIC ACCESS OPEN • CLOSES 6PM
          </p>
        </div>
      </div>
    );
  }

  if (dropState === 'gold_access') {
    return (
      <div className="bg-yellow-500 text-black py-3 text-center border-b border-yellow-600">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          <p className="text-xs md:text-sm font-black tracking-widest uppercase">
            GOLD MEMBER EARLY ACCESS IS LIVE • PUBLIC DROP WED 5AM
          </p>
        </div>
      </div>
    );
  }

  if (dropState === 'closed') {
    return (
      <div className="bg-zinc-900 text-white py-3 text-center border-b border-black">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase text-gray-300">
            Orders Closed — Next Drop: Tuesday (Gold) → Wednesday 5 AM (Public)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white py-3 text-center border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
          <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-400">
            Next Drop Starts In:
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm md:text-base font-mono font-bold tracking-widest">
          <div className="flex flex-col items-center leading-none">
            <span>{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase">Days</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center leading-none">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase">Hrs</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center leading-none">
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase">Min</span>
          </div>
          <span>:</span>
          <div className="flex flex-col items-center leading-none">
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase">Sec</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-4 bg-gray-700"></div>

        <p className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wide hidden md:block">
          Gold Access: Tue 8AM • Public: Wed 5AM
        </p>
      </div>
    </div>
  );
}
