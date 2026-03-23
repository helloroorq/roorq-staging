import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { CategoryMenu } from '@/components/navbar/menu-data'

const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf8f3]'

type MobileMenuSectionProps = {
  menu: CategoryMenu
  isExpanded: boolean
  onToggle: () => void
  onNavigate?: () => void
}

export default function MobileMenuSection({
  menu,
  isExpanded,
  onToggle,
  onNavigate,
}: MobileMenuSectionProps) {
  return (
    <section className="border-b border-black/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`flex w-full items-center justify-between py-4 text-left ${focusRingClass}`}
      >
        <div>
          <p className={`text-base font-semibold ${menu.accent === 'sale' ? 'text-rose-600' : 'text-slate-950'}`}>
            {menu.label}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-stone-400 transition ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-stone-100 py-4">
            <Link
              href={menu.href}
              onClick={onNavigate}
              className={`inline-flex text-sm font-semibold text-slate-900 ${focusRingClass}`}
            >
              Shop all {menu.label}
            </Link>

            <div className="mt-5 space-y-5">
              {menu.sections.map((section) => {
                return (
                  <div key={section.title}>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                      {section.title}
                    </p>
                    <div className="space-y-2">
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={onNavigate}
                          className={`block py-1 text-sm text-slate-900 ${focusRingClass}`}
                        >
                          <p className="font-medium">{link.label}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <Link
              href={menu.featured.href}
              onClick={onNavigate}
              className={`mt-5 flex items-center gap-3 rounded-[18px] border border-stone-200 bg-stone-50 p-3 ${focusRingClass}`}
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[14px] bg-stone-100">
                <Image src={menu.featured.image} alt={menu.featured.title} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  {menu.featured.eyebrow}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">{menu.featured.title}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
