import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConversationThreadClient from '@/components/messages/ConversationThreadClient'
import { createClient } from '@/lib/supabase/server'
import { getConversationDetailForUser } from '@/lib/conversations/server'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({
  title: 'Conversation',
  description: 'Message thread on Roorq.',
  path: '/messages',
  noIndex: true,
})

export default async function MessageThreadPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth?mode=signin&redirect=/messages/${params.id}`)
  }

  const detail = await getConversationDetailForUser(user.id, params.id)
  if (!detail) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ConversationThreadClient
          currentUserId={user.id}
          conversationId={params.id}
          initialConversation={detail.conversation}
          initialMessages={detail.messages}
        />
      </main>
      <Footer />
    </div>
  )
}
