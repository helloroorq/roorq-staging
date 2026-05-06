'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  LineChart,
  Settings,
  FileText,
  Store,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
  { label: 'Products', href: '/seller/products', icon: Package },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { label: 'Payouts', href: '/seller/payouts', icon: Wallet },
  { label: 'Analytics', href: '/seller/analytics', icon: LineChart },
  { label: 'Store', href: '/seller/settings', icon: Store },
  { label: 'Documents', href: '/seller/settings/documents', icon: FileText },
  { label: 'Settings', href: '/seller/settings/profile', icon: Settings },
]

export default function VendorNav() {
  const pathname = usePathname() ?? ''

  return (
    <>
      <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/seller" className="font-bold text-xl tracking-tighter">
                ROORQ SELLER
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-6">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
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
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-black">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white sm:hidden">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold uppercase tracking-widest ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
