import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MessagesInbox from '@/components/messages/MessagesInbox'
import { createClient } from '@/lib/supabase/server'
import { listConversationPreviewsForUser } from '@/lib/conversations/server'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({
  title: 'Messages',
  description: 'Private buyer and seller conversations on Roorq.',
  path: '/messages',
  noIndex: true,
})

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth?mode=signin&redirect=/messages')
  }

  const { conversations } = await listConversationPreviewsForUser(user.id, { limit: 50 })

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Marketplace inbox</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">Messages</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Keep all buyer and seller conversations in one place without leaving the marketplace flow.
          </p>
        </div>

        <MessagesInbox conversations={conversations} />
      </main>
      <Footer />
    </div>
  )
}
