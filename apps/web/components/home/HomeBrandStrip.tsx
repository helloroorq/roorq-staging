type Partner = {
  name: string
  initial?: string
  small?: string
}

const PARTNERS: Partner[] = [
  { name: 'IIT ROORKEE', initial: 'IITR' },
  { name: 'Thomso', small: 'The Spirit of IIT Roorkee' },
  { name: 'COGNIZANCE', small: 'IIT ROORKEE' },
  { name: 'CAMPUS FOUNDERS CLUB', initial: 'CFC' },
  { name: 'StartupIndia' },
]

export default function HomeBrandStrip() {
  return (
    <section
      aria-label="Roorq partners"
      className="border-b border-stone-200/80 bg-[#f7f4ee]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <ul className="grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {PARTNERS.map((partner) => (
            <li
              key={partner.name}
              className="flex items-center justify-center"
            >
              <PartnerLogo partner={partner} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const tone = 'text-slate-500/90 transition duration-[180ms] hover:text-slate-900'

  return (
    <div className={`flex items-center gap-2 ${tone}`}>
      {partner.initial ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current text-[10px] font-black tracking-[0.05em]">
          {partner.initial}
        </span>
      ) : null}
      <div className="flex flex-col leading-none">
        <span className="text-[14px] font-black tracking-[0.06em]">{partner.name}</span>
        {partner.small ? (
          <span className="mt-1 text-[9.5px] font-medium tracking-[0.16em] text-current/70">
            {partner.small.toUpperCase()}
          </span>
        ) : null}
      </div>
    </div>
  )
}
