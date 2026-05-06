import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Sizing Guide',
  description: 'How we measure vintage sizing and fit at Roorq.',
  path: '/sizing',
  keywords: ['sizing guide', 'fit', 'vintage sizing'],
});

export default function SizingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Sizing Guide', path: '/sizing' },
        ])}
      />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Sizing Guide</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-lg font-medium mb-8">Vintage sizing can be tricky. A "Medium" from 1990 fits differently than a "Medium" today. Here is how we measure.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border p-6">
              <h3 className="font-black uppercase mb-4">Tops (T-Shirts, Jackets, Sweatshirts)</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>Pit to Pit:</strong> Measured from one armpit to the other across the chest.</li>
                <li><strong>Length:</strong> Measured from the top of the shoulder to the bottom hem.</li>
              </ul>
            </div>
            <div className="border p-6">
              <h3 className="font-black uppercase mb-4">Bottoms (Jeans, Trousers)</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>Waist:</strong> Measured straight across the waistband (x2).</li>
                <li><strong>Inseam:</strong> Measured from the crotch seam to the leg opening.</li>
              </ul>
            </div>
          </div>

          <h3 className="font-black uppercase mb-4">Standard Size Chart (Estimates)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-100 font-bold uppercase">
                <tr>
                  <th className="p-3 border">Size</th>
                  <th className="p-3 border">Chest (Inches)</th>
                  <th className="p-3 border">Waist (Inches)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border">XS</td><td className="p-3 border">34-36</td><td className="p-3 border">28-30</td></tr>
                <tr><td className="p-3 border">S</td><td className="p-3 border">36-38</td><td className="p-3 border">30-32</td></tr>
                <tr><td className="p-3 border">M</td><td className="p-3 border">38-40</td><td className="p-3 border">32-34</td></tr>
                <tr><td className="p-3 border">L</td><td className="p-3 border">40-42</td><td className="p-3 border">34-36</td></tr>
                <tr><td className="p-3 border">XL</td><td className="p-3 border">42-44</td><td className="p-3 border">36-38</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

