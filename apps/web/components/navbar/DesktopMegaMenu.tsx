import Image from 'next/image'
import Link from 'next/link'
import type { CategoryMenu, CategoryMenuSection } from '@/components/navbar/menu-data'

const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

const renderSection = (section: CategoryMenuSection, onNavigate: () => void) => {
  const SectionIcon = section.icon

  return (
    <section key={section.title}>
      <div className="mb-4 flex items-center gap-2">
        <SectionIcon className="h-4 w-4 text-neutral-400" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">{section.title}</p>
      </div>

      <ul className="space-y-3">
        {section.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`group block rounded-xl px-3 py-2 transition hover:bg-neutral-50 ${focusRingClass}`}
            >
              <p className="text-[14px] font-medium text-black transition group-hover:text-neutral-700">{link.label}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">{link.description}</p>
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
      role="region"
      aria-label={`${menu.label} menu`}
      aria-hidden={!isOpen}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onEscape?.()
        }
      }}
      className={`absolute inset-x-0 top-full z-[65] transition-all duration-200 ease-out ${
        isOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
      }`}
    >
      <div className="border-t border-black/10 bg-white/95 backdrop-blur-sm shadow-[0_22px_44px_rgba(10,20,35,0.12)]">
        <div className="px-6 py-7 lg:px-8">
          <div className="flex items-end justify-between gap-6 border-b border-neutral-100 pb-5">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Shop {menu.label}</p>
              <p className="mt-2 text-sm text-neutral-600">{menu.description}</p>
            </div>

            <Link
              href={menu.href}
              onClick={onClose}
              className={`inline-flex h-10 items-center rounded-full border border-neutral-300 px-4 text-sm font-medium text-black transition hover:border-black ${focusRingClass}`}
            >
              View all {menu.label}
            </Link>
          </div>

          <div className="grid gap-7 pt-6 xl:grid-cols-[repeat(3,minmax(0,1fr))_320px]">
            {menu.sections.map((section) => renderSection(section, onClose))}

            <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <Link href={menu.featured.href} onClick={onClose} className={`block ${focusRingClass}`}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
                  <Image
                    src={menu.featured.image}
                    alt={menu.featured.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  {menu.featured.eyebrow}
                </p>
                <h4 className="mt-2 text-lg font-semibold text-black">{menu.featured.title}</h4>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{menu.featured.description}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-black transition hover:text-neutral-600">
                  Explore edit
                </span>
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
