'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'roorq_entry_notice_accepted';
const POPUP_IMAGE_URL = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop';

export default function FirstVisitModal() {
  const pathname = usePathname() ?? '';
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const interestOptions = ['Mens', 'Womens', 'All'];
  const brandOptions = ['Carhartt', 'Ralph Lauren', 'Nike', 'Patagonia', 'Harley Davidson'];

  useEffect(() => {
    if (pathname !== '/' || pathname.startsWith('/admin') || pathname.startsWith('/seller')) return;
    if (typeof window === 'undefined') return;

    const accepted = window.localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      const timer = window.setTimeout(() => {
        setIsOpen(true);
      }, 3500);

      return () => window.clearTimeout(timer);
    }
  }, [pathname]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  const toggleOption = (
    value: string,
    current: string[],
    setCurrent: Dispatch<SetStateAction<string[]>>
  ) => {
    if (current.includes(value)) {
      setCurrent(current.filter((item) => item !== value));
    } else {
      setCurrent([...current, value]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/marketing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          interests,
          brands,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Signup failed. Please try again.');
      }

      toast.success('Thanks for signing up!');
      handleDismiss();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setErrorMessage(message);
      setStatus('idle');
    }
  };

  if (!isOpen || pathname !== '/' || pathname.startsWith('/admin') || pathname.startsWith('/seller')) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-title"
    >
      <div className="relative w-full max-w-5xl bg-white shadow-2xl border border-black/10 overflow-hidden rounded-lg">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-white border border-gray-300 text-black text-lg leading-none hover:bg-black hover:text-white transition"
        >
          x
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
          <div className="p-8 md:p-10">
            <div className="text-center">
              <h2 id="entry-title" className="text-3xl md:text-4xl font-black uppercase italic tracking-tight leading-tight">
                Exclusive Discounts
                <br />
                Just For You!
              </h2>
              <p className="text-sm text-gray-600 mt-2">Only if you sign up :)</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black"
              />

              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3">What are you interested in?</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {interestOptions.map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={interests.includes(item)}
                        onChange={() => toggleOption(item, interests, setInterests)}
                        className="h-4 w-4 accent-black"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3">What's your go to brand?</p>
                <div className="space-y-3 text-sm">
                  {brandOptions.map((brand) => (
                    <label key={brand} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={brands.includes(brand)}
                        onChange={() => toggleOption(brand, brands, setBrands)}
                        className="h-4 w-4 accent-black"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-black text-white py-3 text-sm font-black uppercase tracking-widest rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Submitting...' : 'Sign Me Up'}
              </button>

              {errorMessage ? (
                <p className="text-xs text-red-600 text-center">{errorMessage}</p>
              ) : null}

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-xs text-gray-500 hover:text-black"
              >
                No Thanks
              </button>
            </form>
          </div>

          <div className="relative min-h-[320px] md:min-h-full">
            <Image
              src={POPUP_IMAGE_URL}
              alt="Roorq signup"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
