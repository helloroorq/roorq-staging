import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';

export const metadata = buildMetadata({
  title: 'Membership',
  description: 'Roorq Gold membership with early access and free delivery.',
  path: '/membership',
  keywords: ['membership', 'Roorq Gold', 'early access'],
});

export default function MembershipPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Membership', path: '/membership' },
        ])}
      />
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-black text-white py-24 px-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
             {/* Abstract pattern could go here */}
          </div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-1 text-xs font-black uppercase tracking-widest mb-8 transform -rotate-2">
              Limited Membership
            </div>
            <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter leading-none mb-6">
              Roorq<span className="text-yellow-500">Gold</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-mono uppercase tracking-wide leading-relaxed">
              The ultimate advantage. Get early access, exclusive drops, and free delivery forever.
            </p>
          </div>
        </section>

        {/* Pricing / Benefits */}
        <section className="py-20 px-4 bg-zinc-50">
          <div className="max-w-4xl mx-auto bg-white border-2 border-black p-8 md:p-16 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">Member Benefits</h2>
                <ul className="space-y-6">
                  {[
                    '24-Hour Early Access to Weekly Drops',
                    'Unlimited Free Delivery on All Orders',
                    'Exclusive "Gold-Only" Mystery Boxes',
                    'Priority Support & Returns',
                    '5% Extra Discount on Sale Items'
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <div className="bg-black text-white p-1 mt-1 rounded-full">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-lg font-bold uppercase tracking-wide">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="w-full md:w-auto bg-gray-900 text-white p-8 text-center min-w-[300px]">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4 fill-current" />
                <div className="text-5xl font-black mb-2">₹499</div>
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-8">Per Semester</div>
                <Link
                  href="/contact?topic=membership"
                  className="block w-full bg-yellow-500 text-black font-black uppercase tracking-widest py-4 hover:bg-white hover:text-black transition-colors"
                >
                  Join Now
                </Link>
                <p className="mt-4 text-[10px] text-gray-500">Secure Payment • Cancel Anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 text-center">
          <p className="uppercase font-black tracking-widest text-sm mb-4">Trusted by 500+ IITR Students</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-black text-black" />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

