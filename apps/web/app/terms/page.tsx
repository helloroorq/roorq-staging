import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Roorq terms of service for campus-only drops and COD orders.',
  path: '/terms',
  keywords: ['terms', 'cod policy', 'Roorq terms'],
});

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Terms of Service', path: '/terms' },
        ])}
      />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-sm uppercase font-bold tracking-widest mb-6">Last Updated: November 2024</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">1. Acceptance of Terms</h3>
          <p>By accessing Roorq.com, you agree to be bound by these Terms of Service. These terms apply to all users of the site, including browsers, vendors, customers, and contributors of content.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">2. Campus Exclusivity</h3>
          <p>Roorq is exclusively for students of IIT Roorkee. We reserve the right to cancel orders if the delivery address is not within the campus or approved hostels.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">3. Product Conditions</h3>
          <p>All items are vintage or surplus. While we ensure quality, minor signs of wear (small fading, pinholes) may be present. These are not defects but characteristics of vintage clothing.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">4. Payments</h3>
          <p>We accept Cash on Delivery (COD) for first-time users. UPI and online payments are unlocked after your first successful delivery.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

