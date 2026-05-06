import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Returns Policy',
  description: 'Returns and refunds policy for Roorq orders.',
  path: '/returns-policy',
  keywords: ['returns', 'refunds', 'policy'],
});

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Returns Policy', path: '/returns-policy' },
        ])}
      />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Returns & Refunds</h1>
        <div className="prose prose-gray max-w-none">
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">48-Hour "No Questions" Returns</h3>
          <p>If the fit isn't right or you just don't vibe with it, you can return it within 48 hours of delivery.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">How to Return</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to your Profile &gt; Orders.</li>
            <li>Select the item and click "Request Return".</li>
            <li>Our rider will pick it up from your hostel room within 24 hours.</li>
          </ol>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">Refunds</h3>
          <p>Refunds are processed instantly to your Roorq Wallet or within 3-5 business days to your original payment method.</p>
          
          <h3 className="text-xl font-bold uppercase mt-8 mb-4">Non-Returnable Items</h3>
          <p>Mystery Boxes and Underwear/Socks are final sale and cannot be returned.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

