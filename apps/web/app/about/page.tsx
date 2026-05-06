import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'About',
  description: 'Roorq is a campus-first movement against fast fashion.',
  path: '/about',
  keywords: ['about roorq', 'sustainable fashion', 'IIT Roorkee'],
});

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 text-center leading-none">
            F*ck Fast<br />Fashion
          </h1>
          
          <div className="prose prose-lg md:prose-xl mx-auto text-black">
            <p className="font-bold text-xl md:text-2xl uppercase tracking-wide leading-relaxed mb-8 border-l-4 border-black pl-6">
              We are not just selling clothes. We are declaring war on the disposable culture that is destroying our planet.
            </p>
            
            <div className="space-y-6 font-mono text-sm md:text-base">
              <p>
                Every year, billions of garments are produced, worn once, and discarded. The fashion industry treats clothing like single-use plastic. We reject this.
              </p>
              <p>
                Roorq is built on a simple premise: <span className="font-bold bg-yellow-300 px-1">Clothing should be durable, timeless, and valued.</span>
              </p>
              <p>
                We source only the highest quality vintage and surplus items. These are pieces that have already stood the test of time or were destined for landfill simply because of overproduction.
              </p>
              
              <h3 className="text-2xl font-black uppercase mt-12 mb-4 tracking-tighter">Our Mission</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide IIT Roorkee students with high-quality, affordable alternatives to fast fashion.</li>
                <li>To extend the lifecycle of garments that deserve to be worn.</li>
                <li>To build a community that values style, substance, and sustainability.</li>
              </ul>
              
              <h3 className="text-2xl font-black uppercase mt-12 mb-4 tracking-tighter">The Process</h3>
              <p>
                We hand-pick every item. We clean, repair, and verify authenticity. When you buy from Roorq, you aren't just buying a shirt; you're buying a piece of history and a commitment to a better future.
              </p>
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-sm font-bold uppercase tracking-widest mb-4">Join the Revolution</p>
              <div className="inline-block bg-black text-white px-8 py-4 text-2xl font-black uppercase tracking-widest">
                Roorq.
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

