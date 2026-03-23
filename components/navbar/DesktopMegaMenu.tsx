import Image from 'next/image'
import Link from 'next/link'
import type { CategoryMenu, CategoryMenuSection } from '@/components/navbar/menu-data'

const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

const renderSection = (section: CategoryMenuSection, onNavigate: () => void) => {
  return (
    <section key={section.title}>
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{section.title}</p>
      <ul className="space-y-3">
        {section.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`block text-[15px] font-medium text-slate-900 transition hover:text-slate-600 ${focusRingClass}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

type DesktopMegaMenuProps = {
  menu: CategoryMenu
  isOpen: boolean
  onClose: () => void
  onEscape?: () => void
}

export default function DesktopMegaMenu({
  menu,
  isOpen,
  onClose,
  onEscape,
}: DesktopMegaMenuProps) {
  return (
    <div
      id={`mega-menu-panel-${menu.id}`}
      role="menu"
      aria-label={`${menu.label} category menu`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onEscape?.()
        }
      }}
      className={`absolute inset-x-0 top-full z-[65] transition-all duration-150 ease-out ${
        isOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
      }`}
    >
      <div className="border-t border-black/10 bg-white shadow-[0_22px_38px_rgba(15,23,42,0.08)]">
        <div className="mx-auto max-w-[1880px] px-6 py-8 xl:px-8">
          <div className="flex items-center justify-between gap-6 border-b border-stone-100 pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Browse</p>
              <h3 className="mt-2 text-[1.6rem] font-black tracking-[-0.04em] text-slate-950">{menu.label}</h3>
            </div>
            <Link
              href={menu.href}
              onClick={onClose}
              className={`text-sm font-semibold text-slate-900 transition hover:text-slate-600 ${focusRingClass}`}
            >
              Shop all {menu.label}
            </Link>
          </div>

          <div className="grid gap-10 pt-7 xl:grid-cols-[repeat(3,minmax(0,1fr))_280px] xl:gap-12">
            {menu.sections.map((section) => renderSection(section, onClose))}

            <aside className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
              <Link href={menu.featured.href} onClick={onClose} className={`block ${focusRingClass}`}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-stone-100">
                  <Image
                    src={menu.featured.image}
                    alt={menu.featured.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 280px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  {menu.featured.eyebrow}
                </p>
                <h4 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-slate-950">
                  {menu.featured.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{menu.featured.description}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-slate-900 transition hover:text-slate-600">
                  View edit
                </span>
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
