import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'How Selling Works',
  description: 'Learn how the Roorq marketplace works for sellers.',
  path: '/sell/learn',
})

export default function SellLearnPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Roorq Marketplace</p>
            <h1 className="text-4xl font-black mt-3">How selling works</h1>
          </div>
          <Link href="/sell/signup" className="bg-black text-white px-5 py-3 text-sm font-bold uppercase tracking-widest">
            Start selling
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Apply & verify',
              body: 'Submit your business details and KYC documents. Our team reviews within 24-48 hours.',
            },
            {
              title: 'List your products',
              body: 'Upload photos, set pricing, and manage stock. Every listing is reviewed for quality.',
            },
            {
              title: 'Ship with confidence',
              body: 'Receive orders, pack items, and add tracking. Payouts release after delivery.',
            },
          ].map((step, index) => (
            <div key={step.title} className="border border-gray-200 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Step {index + 1}</p>
              <h2 className="text-xl font-bold mt-3 mb-2">{step.title}</h2>
              <p className="text-gray-600 text-sm">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Fees & payouts</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Flat 15% commission per sale.</li>
              <li>No upfront fees, no subscription.</li>
              <li>Weekly payouts every Monday.</li>
            </ul>
          </div>
          <div className="border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">FAQ</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Can students sell? Yes, with valid ID and address proof.</li>
              <li>Do you handle shipping? You ship, we provide buyer updates.</li>
              <li>How fast are approvals? Typically within 48 hours.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
