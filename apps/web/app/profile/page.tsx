import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, CreditCard, MessageSquare, ReceiptText, Sparkles, Store, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { buildMetadata } from '@/lib/seo/metadata'
import { createClient } from '@/lib/supabase/server'
import { fetchKarmaSnapshot } from '@/lib/karma/server'
import KarmaBalanceCard from '@/components/karma/KarmaBalanceCard'
import KarmaRewardStates from '@/components/karma/KarmaRewardStates'

export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({
  title: 'Profile',
  description: 'Manage your Roorq account, orders, referrals, and marketplace settings.',
  path: '/profile',
  noIndex: true,
})

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth?mode=signin&redirect=/profile')
  }

  const { data: profile } = await supabase
    .from('users')
    .select(
      'email, full_name, phone, hostel, room_number, first_cod_done, referral_code, user_type, vendor_status, store_name'
    )
    .eq('id', user.id)
    .maybeSingle()

  const karmaSnapshot = await fetchKarmaSnapshot(supabase, user.id).catch(() => null)

  const quickLinks = [
    {
      href: '/messages',
      title: 'Messages',
      description: 'Keep seller conversations and questions organized.',
      icon: MessageSquare,
    },
    {
      href: '/orders',
      title: 'Orders',
      description: 'Track deliveries, statuses, and past purchases.',
      icon: ReceiptText,
    },
    {
      href: '/referrals',
      title: 'Referrals',
      description: 'Share your code and unlock marketplace rewards.',
      icon: Users,
    },
    {
      href: '/karma',
      title: 'Karma credits',
      description: 'View balance and redeem at checkout.',
      icon: Sparkles,
    },
    {
      href: profile?.user_type === 'vendor' ? '/seller' : '/sell',
      title: profile?.user_type === 'vendor' ? 'Seller hub' : 'Start selling',
      description:
        profile?.user_type === 'vendor'
          ? 'Manage listings, storefront details, and orders.'
          : 'Create your store and start listing products.',
      icon: Store,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
            <div className="border-b border-stone-100 px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Account</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">My profile</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Keep your delivery details, payment access, and marketplace tools ready so checkout and messaging stay frictionless.
              </p>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Personal details
                </p>
                <dl className="mt-5 space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Email</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">{profile?.email || user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Full name</dt>
                    <dd className="mt-1 text-sm text-slate-700">{profile?.full_name || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Phone</dt>
                    <dd className="mt-1 text-sm text-slate-700">{profile?.phone || 'Not set'}</dd>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Hostel</dt>
                      <dd className="mt-1 text-sm text-slate-700">{profile?.hostel || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Room number</dt>
                      <dd className="mt-1 text-sm text-slate-700">{profile?.room_number || 'Not set'}</dd>
                    </div>
                  </div>
                </dl>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-stone-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Payment access</p>
                      <p className="text-xs text-stone-500">Checkout stays dynamic based on account status.</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                      <span className="text-slate-700">Cash on delivery</span>
                      <span className="inline-flex items-center gap-2 font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                      <span className="text-slate-700">UPI payments</span>
                      {profile?.first_cod_done ? (
                        <span className="inline-flex items-center gap-2 font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-right text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Unlock after your first COD order
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-stone-200 bg-slate-950 p-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">Referral code</p>
                  <p className="mt-3 rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold tracking-[0.18em]">
                    {profile?.referral_code || 'Generating...'}
                  </p>
                  <p className="mt-3 text-sm text-white/70">
                    Share this in campus groups or DMs to drive your next referral reward.
                  </p>
                </div>

              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {karmaSnapshot ? (
              <section id="karma" className="space-y-5">
                <KarmaBalanceCard snapshot={karmaSnapshot} />
                <KarmaRewardStates snapshot={karmaSnapshot} />
              </section>
            ) : null}

            <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
              <div className="border-b border-stone-100 px-6 py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Quick actions</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950">Move faster</h2>
              </div>
              <div className="space-y-3 p-4">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-start gap-4 rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-4 transition hover:border-stone-300 hover:bg-white"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{link.title}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-500">{link.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {profile?.user_type === 'vendor' && (
              <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
                <div className="px-6 py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Store status</p>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950">
                    {profile.store_name || 'Vendor account'}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    Vendor status: <span className="font-semibold capitalize text-slate-950">{profile.vendor_status || 'pending'}</span>
                  </p>
                  <Link
                    href="/seller"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open seller hub
                    <Store className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
