import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Locations',
  description: 'Find Roorq pickup points and campus locations.',
  path: '/locations',
  keywords: ['locations', 'pickup', 'IIT Roorkee'],
});

export default function LocationsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Locations', path: '/locations' },
        ])}
      />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Retail Locations</h1>
        
        <div className="border border-black p-6 mb-4">
            <h3 className="text-xl font-black uppercase mb-2">Roorq HQ (Pickup Point)</h3>
            <p>Behind Ravindra Bhawan</p>
            <p>IIT Roorkee Campus</p>
            <p className="text-sm text-gray-500 mt-2">Open Mon-Sat, 6 PM - 9 PM</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

