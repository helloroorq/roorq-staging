import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'FAQ',
  description: 'Answers to common questions about orders, delivery, and returns.',
  path: '/faq',
  keywords: ['faq', 'orders', 'returns', 'delivery'],
});

const faqItems = [
  {
    question: 'Can I cancel my order?',
    answer:
      'You can cancel your order if you let us know before we dispatch the order.',
  },
  {
    question: 'Can I change the shipping address on my order?',
    answer:
      "Yes, as long as we haven't shipped it yet. Please contact support to update the address.",
  },
  {
    question: 'Can I add or remove an item from my order?',
    answer:
      'We can adjust an order if you notify us before dispatch so we can update the items.',
  },
  {
    question: 'When will my order be shipped?',
    answer:
      'Please allow 1-2 working days for handling. Orders placed over weekends or bank holidays ship next working day.',
  },
  {
    question: 'Can I return my items?',
    answer:
      'Returns are accepted within 30 days of purchase as long as the item is in its original condition.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={[
          faqSchema(faqItems),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-12 text-center">
            Help Center
          </h1>
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
}

