import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Cookie Policy',
  description: 'Learn how Roorq uses cookies and analytics.',
  path: '/cookies',
})

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>
          <div className="space-y-6 text-sm md:text-base text-gray-700">
            <p>
              This page explains how Roorq uses cookies and similar storage to keep your account secure
              and improve your shopping experience.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-black">Essential cookies (always on)</h2>
              <p>
                These are required for core functionality such as signing in, protecting your session,
                and keeping items in your cart.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Supabase auth cookies</span> (sb-*) keep you signed in
                  and protect your session.
                </li>
                <li>
                  <span className="font-semibold">Cart storage</span> keeps items in your cart while you browse.
                </li>
                <li>
                  <span className="font-semibold">roorq_cookie_consent</span> stores your cookie choice so we do not
                  show the banner again.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-black">Analytics cookies (optional)</h2>
              <p>
                We only load Google Analytics after you accept. These cookies help us understand traffic
                and improve performance.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">_ga</span> and <span className="font-semibold">_ga_*</span> track
                  anonymous usage patterns.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-black">Your choices</h2>
              <p>
                You can accept all cookies or reject non-essential cookies at any time. To change your
                choice, clear your browser cookies for this site and the banner will appear again.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-black">Contact</h2>
              <p>
                If you have questions about this policy, contact the Roorq team at the email address listed
                on the site.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
