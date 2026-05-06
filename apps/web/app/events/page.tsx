import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import NotifyMeForm from '@/components/NotifyMeForm';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Events',
  description: 'Campus pop-ups and thrift meets hosted by Roorq.',
  path: '/events',
  keywords: ['events', 'campus pop-up', 'thrift meet'],
});

export default function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Events', path: '/events' },
        ])}
      />
      <Navbar />
      <main className="flex-1">
        <div className="py-20 bg-black text-white text-center px-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">Campus Events</h1>
          <p className="text-xl text-gray-400 uppercase tracking-widest">Pop-ups & Thrift Meets</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="border-2 border-dashed border-gray-300 p-12 rounded-lg">
            <h3 className="text-2xl font-black uppercase mb-4">No Upcoming Events</h3>
            <p className="text-gray-600 mb-8">We are planning our next pop-up at the Multi-Activity Centre (MAC). Stay tuned.</p>
            <NotifyMeForm
              interest="events"
              placeholder="you@example.com"
              className="mx-auto flex max-w-md gap-2"
              inputClassName="w-full border border-gray-300 px-4 py-3 text-sm font-medium outline-none focus:border-black"
              buttonClassName="bg-black text-white px-6 py-3 uppercase font-bold tracking-widest disabled:opacity-60"
              successMessage="You are subscribed for event updates."
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

