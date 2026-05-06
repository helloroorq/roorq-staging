import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'How Roorq collects, uses, and protects customer data.',
  path: '/privacy',
  keywords: ['privacy policy', 'data protection', 'Roorq'],
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' },
        ])}
      />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-sm uppercase font-bold tracking-widest mb-6">Your Data is Yours.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">1. Information We Collect</h3>
          <p>We collect information necessary to fulfill your order: Name, Hostel Address, Email, and Phone Number.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">2. How We Use It</h3>
          <p>Your data is used solely for:</p>
          <ul className="list-disc pl-5">
            <li>Processing and delivering your orders</li>
            <li>Sending drop notifications (if opted in)</li>
            <li>Fraud prevention</li>
          </ul>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">3. No Third Parties</h3>
          <p>We do not sell, trade, or transfer your PII to outside parties. We are a campus-based community platform.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

