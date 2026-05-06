import Image from 'next/image'

const FOUNDERS = [
  {
    name: 'Ajaz Ahmed',
    role: 'Co-founder, product and community',
    image:
      'https://images.unsplash.com/photo-1533892384826-5e11e8efc13b?auto=format&fit=crop&w=900&q=80',
    alt: 'Ajaz Ahmed in a hoodie on campus steps',
  },
  {
    name: 'Harish Nenavath',
    role: 'Co-founder, growth and operations',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    alt: 'Harish Nenavath in a candid campus setting',
  },
]

export default function HomeTeamSection() {
  return (
    <section className="bg-white">
      <div
        className="mx-auto max-w-[1180px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        style={{ fontFamily: 'Inter, Helvetica, Arial, system-ui, sans-serif' }}
      >
        <div className="max-w-lg">
          <h2 className="text-[30px] font-bold tracking-[-0.04em] text-black sm:text-[34px]">Meet the team</h2>
          <p className="mt-5 text-sm leading-7 text-[#777777] sm:text-[15px]">Built by students, for students.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-y-16 md:mt-20 md:grid-cols-2 md:gap-x-24 lg:gap-x-32">
          {FOUNDERS.map((founder) => (
            <article key={founder.name} className="flex flex-col items-start">
              <div className="relative aspect-square w-24 overflow-hidden bg-neutral-100 sm:w-28">
                <Image
                  src={founder.image}
                  alt={founder.alt}
                  fill
                  sizes="(max-width: 640px) 96px, 112px"
                  className="object-cover transition duration-300 hover:scale-[1.02]"
                />
              </div>

              <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.03em] text-black sm:text-[22px]">
                {founder.name}
              </h3>
              <p className="mt-1 text-[13px] leading-6 text-[#777777] sm:text-sm">{founder.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
