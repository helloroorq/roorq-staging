'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Instagram } from 'lucide-react';

export default function CommunityStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const photos = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1529139574466-a302c27e3844?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0815a046baf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', // Repetitive for scroll length
  ];

  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">As Seen On Campus</h2>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Join the community @roorq.iitr</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-2 border border-gray-200 hover:bg-black hover:text-white transition rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 border border-gray-200 hover:bg-black hover:text-white transition rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {photos.map((src, idx) => (
            <div key={idx} className="min-w-[250px] md:min-w-[300px] relative aspect-[4/5] bg-gray-100 group cursor-pointer">
              <Image
                src={src}
                alt={`Community ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 60vw, 20vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Instagram className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
