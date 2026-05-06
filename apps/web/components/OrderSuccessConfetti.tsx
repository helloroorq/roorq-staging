'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useSearchParams } from 'next/navigation';

export default function OrderSuccessConfetti() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get('payment');

  useEffect(() => {
    if (paymentStatus === 'success') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [paymentStatus]);

  if (paymentStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6 text-center">
        <p className="font-bold">Payment Successful!</p>
        <p className="text-sm">Your order has been confirmed.</p>
      </div>
    );
  }

  return null;
}
