'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const quotes = [
  "Defined by the streets of Roorq.",
  "Exclusivity is the new currency.",
  "Campus culture, elevated.",
  "Not thrift. Just smart.",
  "Wednesday is the new Friday.",
  "Wear what speaks to you.",
  "The drop is waiting.",
  "Roorq. Since 2024.",
  "Style is a way to say who you are without having to speak.",
  "Quality over quantity. Always.",
];


export default function Preloader() {
  const pathname = usePathname() ?? '';
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState('');
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (pathname !== '/' || pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
      setLoading(false);
      setIsVisible(false);
      return;
    }

    // Select random quote on mount
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Check session storage to show only once per session
    const hasLoaded = sessionStorage.getItem('roorq_loaded');
    if (hasLoaded) {
      setLoading(false);
      setIsVisible(false);
      return;
    }

    // Progress animation logic
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15; // Random speed
      if (currentProgress > 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Smooth exit
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            setLoading(false);
            sessionStorage.setItem('roorq_loaded', 'true');
          }, 500); // Wait for fade out animation
        }, 500);
      }
      setProgress(currentProgress);
    }, 200);

    return () => clearInterval(interval);
  }, [pathname]);

  if (!loading || pathname !== '/') return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#fcfbf9] text-black flex flex-col items-center justify-center font-serif transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="max-w-2xl px-8 text-center">
        <div className="mb-4 flex justify-center">
          <Image
            src="/roorq-final7.png"
            alt="Roorq"
            width={500}
            height={500}
            className="h-100 w-100 object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0)]"
            priority
          />
        </div>

        {/* Quote */}
        <h1 className="text-3xl md:text-5xl font-light italic leading-tight mb-8 animate-in slide-in-from-bottom-4 duration-1000 font-playfair">
          "{quote}"
        </h1>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/80 -mt-2">
            ROORQ.COM
          </p>

          {/* Minimal Progress Line */}
          <div className="w-48 h-[1px] bg-black/10 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[10px] font-mono text-gray-400 tracking-widest">
            {Math.round(progress).toString().padStart(3, '0')} / 100
          </p>
        </div>
      </div>
    </div>
  );
}
