'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RoorqLogo from '@/components/RoorqLogo';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Calendar,
  Users,
  UserCog,
  LogOut,
  Truck,
  ShieldAlert,
  Scale,
  CreditCard,
  ScrollText,
  ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Vendors', href: '/admin/vendors', icon: Users },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Disputes', href: '/admin/disputes', icon: Scale },
  { label: 'Moderation', href: '/admin/moderation', icon: ShieldAlert },
  { label: 'Ops Notes', href: '/admin/operations', icon: ClipboardList },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Riders', href: '/admin/riders', icon: Truck },
  { label: 'Users', href: '/admin/users', icon: UserCog },
  { label: 'Drops', href: '/admin/drops', icon: Calendar },
  { label: 'Referrals', href: '/admin/referrals', icon: Users },
];

export default function AdminNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                <RoorqLogo className="h-7 w-auto" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Admin</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-black text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-black flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
