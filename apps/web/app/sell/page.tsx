import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Sell on Roorq',
  description: 'Start selling on Roorq. Join the marketplace for curated vintage fashion.',
  path: '/sell',
})

export default function SellLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-4">Roorq Marketplace</p>
            <h1 className="text-5xl md:text-6xl font-black leading-[0.95]">Start selling to the next wave of campus buyers.</h1>
            <p className="mt-6 text-lg text-white/70">
              List your pieces, control your inventory, and ship direct. Roorq handles discovery and takes a flat 15% commission only on sales.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/sell/signup" className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest">Register as Seller</Link>
              <Link href="/sell/learn" className="border border-white/30 px-6 py-3 font-bold uppercase tracking-widest">How it works</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
              <div className="border border-white/10 p-4">
                <p className="text-white/60 uppercase text-xs tracking-[0.2em]">Commission</p>
                <p className="text-2xl font-bold">15%</p>
              </div>
              <div className="border border-white/10 p-4">
                <p className="text-white/60 uppercase text-xs tracking-[0.2em]">Payouts</p>
                <p className="text-2xl font-bold">Weekly</p>
              </div>
              <div className="border border-white/10 p-4">
                <p className="text-white/60 uppercase text-xs tracking-[0.2em]">Inventory</p>
                <p className="text-2xl font-bold">You control</p>
              </div>
              <div className="border border-white/10 p-4">
                <p className="text-white/60 uppercase text-xs tracking-[0.2em]">Support</p>
                <p className="text-2xl font-bold">Dedicated</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-4">Why sellers join</h2>
            <ul className="space-y-4 text-white/70">
              <li>Reach IIT & university shoppers without ads.</li>
              <li>Upload products in minutes with mobile-first tools.</li>
              <li>Keep your brand identity with custom store pages.</li>
              <li>Own fulfillment and control your shipping speed.</li>
            </ul>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Need a demo?</p>
              <p className="text-lg font-semibold">sales@roorq.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
