import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Drops',
  description: 'Weekly drops and curated collections from Roorq.',
  path: '/drops',
  keywords: ['drops', 'weekly collections', 'vintage fashion'],
});

export const revalidate = 60;

export default async function DropsPage() {
  const supabase = await createClient();
  
  // Fetch drops
  const { data: drops } = await supabase
    .from('drops')
    .select('*')
    .order('scheduled_at', { ascending: false });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={[
          collectionSchema({
            title: 'Roorq Drops',
            description: 'Weekly drops and curated collections from Roorq.',
            path: '/drops',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Drops', path: '/drops' },
          ]),
        ]}
      />
      <Navbar />
      <main className="flex-1">
        <div className="bg-black text-white py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-4">The Edit</h1>
            <p className="text-xl md:text-2xl font-mono uppercase tracking-widest text-gray-400">Weekly Drops & Curated Collections</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 gap-12">
            {drops && drops.length > 0 ? (
              drops.map((drop) => (
                <div key={drop.id} className="border-2 border-black p-6 md:p-12 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 ${
                        drop.status === 'live' ? 'bg-red-600 text-white' : 
                        drop.status === 'upcoming' ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {drop.status}
                      </span>
                      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">{drop.name}</h2>
                      <p className="text-gray-600 font-mono uppercase tracking-wide">
                        {new Date(drop.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <Link 
                        href={`/shop?drop=${drop.id}`}
                        className="inline-block bg-black text-white px-8 py-4 text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all"
                      >
                        View Collection
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-gray-300">
                <h3 className="text-2xl font-black uppercase tracking-widest text-gray-400">No Drops Found</h3>
                <p className="mt-2 text-gray-500 font-mono">Check back later for the next release.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

