import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import NotifyMeForm from '@/components/NotifyMeForm';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { Package, Zap, Star } from 'lucide-react';

export const metadata = buildMetadata({
  title: 'Mystery Box',
  description: 'Curated vintage mystery boxes with guaranteed value.',
  path: '/mystery-box',
  keywords: ['mystery box', 'vintage bundle', 'Roorq drops'],
});

export default function MysteryBoxPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Mystery Box', path: '/mystery-box' },
        ])}
      />
      <Navbar />
      <main className="flex-1 bg-black text-white">
        {/* Hero */}
        <div className="relative overflow-hidden py-24 px-4 text-center">
          <div className="absolute inset-0 bg-zinc-900 opacity-50">
             {/* Abstract pattern */}
             <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-widest">High Demand Item</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-6 leading-none">
              Mystery<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Box.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-mono uppercase tracking-wide leading-relaxed mb-12">
              3 Curated Vintage Items. Guaranteed Value over ₹3000.
            </p>

            {/* CTA */}
            <div className="bg-white/5 border border-white/10 p-8 md:p-12 backdrop-blur-md max-w-lg mx-auto">
              <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Sold Out</h3>
              <p className="text-sm text-gray-400 font-mono mb-6">The next drop is scheduled for Tuesday at 6 PM.</p>
              
              <NotifyMeForm
                interest="mystery-box"
                placeholder="ENTER EMAIL FOR EARLY ACCESS"
                className="flex gap-2"
                inputClassName="bg-black border border-white/20 text-white px-4 py-3 flex-1 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-white placeholder:text-gray-600"
                buttonClassName="bg-white text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-60"
                successMessage="You are on the mystery box list."
              />
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="py-20 px-4 bg-white text-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-16">Choose Your Tier</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Standard', price: '₹999', items: '2 Items', val: '₹1500+', desc: 'Perfect for starters. Includes 1 Tee and 1 Accessory.' },
                { name: 'Premium', price: '₹1999', items: '3 Items', val: '₹3500+', desc: 'Our bestseller. Includes 1 Jacket, 1 Tee, 1 Hat.', recommended: true },
                { name: 'Gold', price: '₹4999', items: '4 Items', val: '₹8000+', desc: 'Grail items only. Designer brands and heavy outerwear.' }
              ].map((tier, idx) => (
                <div key={idx} className={`border-2 p-8 flex flex-col relative ${tier.recommended ? 'border-black bg-gray-50 scale-105 shadow-xl' : 'border-gray-200'}`}>
                  {tier.recommended && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-2">{tier.name}</h3>
                  <div className="text-4xl font-black mb-6">{tier.price}</div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm font-bold uppercase">
                      <Package className="w-4 h-4" /> {tier.items}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold uppercase">
                      <Star className="w-4 h-4" /> Value {tier.val}
                    </li>
                    <li className="text-xs text-gray-500 font-mono leading-relaxed mt-4">
                      {tier.desc}
                    </li>
                  </ul>
                  <div className="w-full bg-black text-white py-4 text-center text-xs font-black uppercase tracking-widest opacity-60">
                    Sold Out
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
