'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Youtube, Twitter, Shield } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/roorq.iitr',
  facebook: 'https://facebook.com/roorq.iitr',
  youtube: 'https://youtube.com/@roorq',
  twitter: 'https://twitter.com/roorq',
};

export default function Footer() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  return (
    <footer className="bg-black text-white mt-20 font-sans">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/roorq-final7.png"
                alt="Roorq"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
              <h3 className="text-xl font-black tracking-tighter">Roorq.com</h3>
            </div>
            <p className="text-gray-400 text-xs font-medium mb-4 leading-relaxed uppercase tracking-wide">
              Campus-exclusive weekly-drop fashion platform for IIT Roorkee. Authentic vintage at unbeatable prices.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href={SOCIAL_LINKS.instagram}
                className="text-gray-400 hover:text-white transition"
                target="_blank"
                rel="noreferrer"
                aria-label="Roorq Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                className="text-gray-400 hover:text-white transition"
                target="_blank"
                rel="noreferrer"
                aria-label="Roorq Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                className="text-gray-400 hover:text-white transition"
                target="_blank"
                rel="noreferrer"
                aria-label="Roorq YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href={SOCIAL_LINKS.twitter}
                className="text-gray-400 hover:text-white transition"
                target="_blank"
                rel="noreferrer"
                aria-label="Roorq Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-black uppercase text-xs mb-4 tracking-widest">SHOP</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <li><Link href="/shop?gender=men" className="hover:text-white transition">Men&apos;s Vintage</Link></li>
              <li><Link href="/shop?gender=women" className="hover:text-white transition">Women&apos;s Vintage</Link></li>
              <li><Link href="/shop?gender=kids" className="hover:text-white transition">Kids Vintage</Link></li>
              <li><Link href="/shop?category=sportswear" className="hover:text-white transition">Sportswear</Link></li>
              <li><Link href="/shop?category=sale" className="hover:text-white transition">Outlet</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase text-xs mb-4 tracking-widest">SUPPORT</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <li><Link href="/faq" className="hover:text-white transition">F.A.Q.</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Message Us</Link></li>
              <li><Link href="/returns-policy" className="hover:text-white transition">Return Your Order</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition">Shipping</Link></li>
              <li><Link href="/sizing" className="hover:text-white transition">Sizing</Link></li>
              <li><Link href="/returns-policy" className="hover:text-white transition">Returns Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms Of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase text-xs mb-4 tracking-widest">COMPANY INFO</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition">Shipping Policy</Link></li>
              <li><Link href="/returns-policy" className="hover:text-white transition">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase text-xs mb-4 tracking-widest">SHOPS & EVENTS</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <li><Link href="/events" className="hover:text-white transition">Campus Events</Link></li>
              <li><Link href="/wholesale" className="hover:text-white transition">Wholesale</Link></li>
              <li><Link href="/locations" className="hover:text-white transition">Retail Locations</Link></li>
            </ul>

            <h4 className="font-black uppercase text-xs mb-4 mt-6 tracking-widest">THE EDIT - BLOG</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <li><Link href="/editorial" className="hover:text-white transition">The Edit</Link></li>
              <li><Link href="/about" className="hover:text-white transition">Sustainability</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500 font-mono uppercase tracking-widest text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Roorq.com. All rights reserved.</p>
              <p className="mt-1">Built for IIT Roorkee</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Secure Payment</span>
              <div className="flex gap-2 opacity-50 grayscale hover:grayscale-0 transition">
                <div className="bg-white text-black px-2 py-1 text-[10px] font-bold">UPI</div>
                <div className="bg-white text-black px-2 py-1 text-[10px] font-bold">COD</div>
                <div className="bg-white text-black px-2 py-1 text-[10px] font-bold">CASH</div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
