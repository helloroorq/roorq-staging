'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ShoppingCart, Menu, X, User as UserIcon, Search, ChevronDown, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const NAVIGATION_ITEMS = [
  {
    label: 'SALE',
    href: '/shop?category=sale',
    isRed: true,
    dropdown: null
  },
  {
    label: "MEN'S VINTAGE",
    href: '/shop?gender=men',
    dropdown: [
      {
        title: 'Shop By Category',
        links: [
          { label: 'All Men\'s Vintage', href: '/shop?gender=men' },
          { label: 'Vintage Jackets', href: '/shop?category=jacket&gender=men' },
          { label: 'Vintage Sweatshirts', href: '/shop?category=sweater&gender=men' },
          { label: 'Vintage T-Shirts', href: '/shop?category=t-shirt&gender=men' },
          { label: 'Vintage Jeans', href: '/shop?category=jeans&gender=men' },
          { label: 'Vintage Trousers', href: '/shop?category=trousers&gender=men' },
        ]
      },
      {
        title: 'Shop By Brand',
        links: [
          { label: 'Vintage Nike', href: '/shop?search=nike&gender=men' },
          { label: 'Vintage Carhartt', href: '/shop?search=carhartt&gender=men' },
          { label: 'Vintage Ralph Lauren', href: '/shop?search=ralph&gender=men' },
          { label: 'Vintage Adidas', href: '/shop?search=adidas&gender=men' },
          { label: 'Vintage Dickies', href: '/shop?search=dickies&gender=men' },
        ]
      },
      {
        title: 'Collections',
        links: [
          { label: 'New Arrivals', href: '/shop?sort=newest&gender=men' },
          { label: 'Bestsellers', href: '/shop?sort=bestsellers&gender=men' },
          { label: 'Grails (Premium)', href: '/shop?tag=premium&gender=men' },
        ]
      }
    ]
  },
  {
    label: "WOMEN'S VINTAGE",
    href: '/shop?gender=women',
    dropdown: [
      {
        title: 'Shop By Category',
        links: [
          { label: 'All Women\'s Vintage', href: '/shop?gender=women' },
          { label: 'Vintage Jackets', href: '/shop?category=jacket&gender=women' },
          { label: 'Vintage Sweatshirts', href: '/shop?category=sweater&gender=women' },
          { label: 'Vintage T-Shirts', href: '/shop?category=t-shirt&gender=women' },
          { label: 'Vintage Jeans', href: '/shop?category=jeans&gender=women' },
          { label: 'Vintage Skirts', href: '/shop?category=skirt&gender=women' },
        ]
      },
      {
        title: 'Shop By Brand',
        links: [
          { label: 'Vintage Nike', href: '/shop?search=nike&gender=women' },
          { label: 'Vintage Carhartt', href: '/shop?search=carhartt&gender=women' },
          { label: 'Vintage Harley Davidson', href: '/shop?search=harley&gender=women' },
          { label: 'Vintage Disney', href: '/shop?search=disney&gender=women' },
        ]
      },
      {
        title: 'Collections',
        links: [
          { label: 'New Arrivals', href: '/shop?sort=newest&gender=women' },
          { label: 'Y2K Edit', href: '/shop?tag=y2k&gender=women' },
          { label: 'Oversized Fits', href: '/shop?tag=oversized&gender=women' },
        ]
      }
    ]
  },
  {
    label: "KIDS VINTAGE",
    href: '/shop?gender=kids',
    dropdown: null
  },
  {
    label: "SPORTSWEAR",
    href: '/shop?category=sportswear',
    dropdown: null
  },
  {
    label: "F*CK FAST FASHION",
    href: '/about',
    dropdown: null
  },
  {
    label: "THE EDIT",
    href: '/editorial',
    dropdown: null
  }
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  type CartItem = { quantity?: number };

  const handleUserMenuClick = async () => {
    // Always attempt to resolve auth state when the icon is tapped/clicked
    if (user) {
      setIsUserMenuOpen((prev) => !prev);
      return;
    }

    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      if (!error && freshUser) {
        setUser(freshUser);
        setIsUserMenuOpen(true);
        return;
      }
    } catch (err) {
      logger.debug('Auth recheck error', err instanceof Error ? err : undefined);
    }

    router.push('/auth');
  };

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(totalItems);
      } catch (error) {
        logger.error('Error reading cart', error instanceof Error ? error : undefined);
        setCartCount(0);
      }
    };

    // Initial load
    updateCartCount();

    // Listen for storage changes (when cart is updated in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };

    // Listen for custom cart update events (when cart is updated in same tab)
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Check auth state on mount with proper error handling
  useEffect(() => {
    let isMounted = true;
    
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // Handle errors gracefully - don't log out user on temporary network issues
        if (error) {
          // Only clear user state if it's a real auth error, not a network issue
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('JWT')) {
            setUser(null);
            setUserRole(null);
          }
          // For network errors, keep existing state to prevent false logouts
        } else {
          setUser(user);
          
          if (user) {
            try {
              // Use RPC function to avoid RLS recursion
              const { data: role, error: roleError } = await supabase.rpc('get_user_role', { user_id: user.id });
              if (isMounted) {
                if (roleError) {
                  logger.debug('Role fetch error (non-critical)', roleError instanceof Error ? roleError : undefined);
                  // Don't clear user, just don't set role
                } else if (role) {
                  setUserRole(role);
                }
              }
            } catch (err) {
              // Silently handle role fetch errors - don't break user experience
              logger.debug('Role check error', err instanceof Error ? err : undefined);
            }
          } else {
            setUserRole(null);
          }
        }
      } catch (err) {
        // Catch any unexpected errors
        logger.debug('Auth check error', err instanceof Error ? err : undefined);
        // Don't clear user state on unexpected errors - prevent false logouts
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkUser();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      try {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Use RPC function to avoid RLS recursion
            const { data: role, error: roleError } = await supabase.rpc('get_user_role', { user_id: session.user.id });
            if (isMounted) {
              if (roleError) {
                logger.debug('Role fetch error in auth change', roleError instanceof Error ? roleError : undefined);
              } else if (role) {
                setUserRole(role);
              }
            }
          } catch (err) {
            logger.debug('Role check error in auth change', err instanceof Error ? err : undefined);
          }
        } else {
          setUserRole(null);
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          router.refresh();
        }
      } catch (err) {
        logger.debug('Auth state change error', err instanceof Error ? err : undefined);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]); // Include supabase and router in dependencies

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsUserMenuOpen(false);
      setUser(null);
      setUserRole(null);
      // Use replace instead of push to prevent back button issues
      router.replace('/');
      // Remove router.refresh() - it's unnecessary and can cause issues
    } catch (error: unknown) {
      logger.error('Logout error', error instanceof Error ? error : undefined);
      // Still navigate even if signOut fails
      router.replace('/');
    }
  };

  return (
    <div className="w-full font-sans sticky top-0 z-50">
      {/* Top Scrolling Banner */}

      {/* Main Header */}
      <div className="border-b border-gray-200 bg-white relative">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left: Search (Desktop) / Menu (Mobile) */}
            <div className="flex items-center flex-1">
              <button 
                className="p-2 hover:text-gray-600 hidden md:block"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                className="p-2 md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
              <Link href="/" className="flex items-center gap-2 hover:text-red-600 transition-colors">
                <Image
                  src="/roorq-final7.png"
                  alt="Roorq"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                  priority
                />
                <span className="text-3xl md:text-4xl font-extrabold tracking-tighter">roorq.</span>
              </Link>
            </div>

            {/* Right: Utilities */}
            <div className="flex items-center justify-end flex-1 gap-4">
              <div className="hidden md:flex items-center text-sm font-medium cursor-pointer hover:text-gray-600">
                <span className="mr-1">India | INR ₹</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  className="p-2 hover:text-gray-600"
                  onClick={handleUserMenuClick}
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {(userRole === 'admin' || userRole === 'super_admin') && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-sm font-bold text-red-600 hover:bg-gray-100 uppercase"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link 
                        href="/profile"  
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link 
                        href="/orders" 
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link 
                        href="/referrals" 
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Referrals
                      </Link>
                    </div>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/cart" className="p-2 hover:text-gray-600 relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center min-w-[20px]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Bar with Mega Menu */}
        <div className="hidden md:block bg-black text-white text-sm font-bold uppercase tracking-wide relative">
          <div className="max-w-[1800px] mx-auto px-4">
            <ul className="flex justify-center space-x-8">
              {NAVIGATION_ITEMS.map((item) => (
                <li 
                  key={item.label} 
                  className="py-3"
                  onMouseEnter={() => item.dropdown && handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link 
                    href={item.href} 
                    className={`hover:text-gray-300 py-3 border-b-2 border-transparent hover:border-white transition-all ${item.isRed ? 'text-red-500 hover:text-red-400' : ''}`}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Mega Menu Dropdown */}
                  {item.dropdown && activeDropdown === item.label && (
                    <div className="absolute left-0 top-full w-full bg-white text-black shadow-xl border-t border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-w-[1800px] mx-auto px-8 py-8">
                        <div className="grid grid-cols-4 gap-8">
                          {item.dropdown.map((column, idx) => (
                            <div key={idx}>
                              <h3 className="font-black text-xs uppercase tracking-widest mb-4 border-b border-black pb-2">{column.title}</h3>
                              <ul className="space-y-3">
                                {column.links.map((link, linkIdx) => (
                                  <li key={linkIdx}>
                                    <Link 
                                      href={link.href}
                                      className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wide block transition-colors"
                                      onClick={() => setActiveDropdown(null)}
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {/* Add a promo image column if needed */}
                          <div className="col-span-1">
                             <div className="bg-gray-100 h-full w-full flex items-center justify-center p-4">
                               <div className="text-center">
                                 <p className="font-black uppercase tracking-widest mb-2">New Drop</p>
                                 <Link href="/drops" className="text-xs underline">Shop Now</Link>
                               </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 p-4 animate-in slide-in-from-top-2 z-40 shadow-xl">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for products, brands, or styles..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-none text-lg focus:ring-2 focus:ring-black font-bold uppercase tracking-wide placeholder:font-normal placeholder:capitalize"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="relative h-full w-[86%] max-w-sm bg-white overflow-y-auto animate-in slide-in-from-left shadow-[8px_0_24px_rgba(0,0,0,0.25)]">
            <div className="sticky top-0 p-4 border-b border-gray-200 flex justify-between items-center bg-black text-white z-10">
              <span className="font-black text-xl tracking-tighter">MENU</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <ul className="space-y-6">
                {NAVIGATION_ITEMS.map((item) => (
                  <li key={item.label}>
                    <div className="flex justify-between items-center">
                      <Link
                        href={item.href}
                        className={`text-xl font-black uppercase tracking-tighter ${item.isRed ? 'text-red-600' : 'text-black'}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </div>
                    {/* Flattened mobile sub-menu for key items */}
                    {item.dropdown && (
                      <ul className="mt-4 pl-4 space-y-3 border-l-2 border-gray-100">
                        {item.dropdown[0].links.slice(0, 4).map((link, idx) => (
                          <li key={idx}>
                            <Link
                              href={link.href}
                              className="text-sm font-bold text-gray-500 uppercase tracking-wide block"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link href={item.href} className="text-sm font-black underline uppercase" onClick={() => setIsMenuOpen(false)}>View All</Link>
                        </li>
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-gray-100 pt-8">
                {user ? (
                  <>
                    {(userRole === 'admin' || userRole === 'super_admin') && (
                      <Link href="/admin" className="flex items-center gap-4 text-lg font-bold uppercase mb-4 text-red-600" onClick={() => setIsMenuOpen(false)}>
                        <UserIcon className="w-6 h-6" /> Admin Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="flex items-center gap-4 text-lg font-bold uppercase mb-4" onClick={() => setIsMenuOpen(false)}>
                      <UserIcon className="w-6 h-6" /> My Account
                    </Link>
                    <Link href="/orders" className="flex items-center gap-4 text-lg font-bold uppercase mb-4" onClick={() => setIsMenuOpen(false)}>
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-4 text-lg font-bold uppercase text-red-600"
                    >
                      <LogOut className="w-6 h-6" /> Logout
                    </button>
                  </>
                ) : (
                  <Link href="/auth" className="flex items-center gap-4 text-lg font-bold uppercase mb-4" onClick={() => setIsMenuOpen(false)}>
                    <UserIcon className="w-6 h-6" /> Sign In
                  </Link>
                )}
                <Link href="/faq" className="flex items-center gap-4 text-lg font-bold uppercase mt-4" onClick={() => setIsMenuOpen(false)}>
                  Help & FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
