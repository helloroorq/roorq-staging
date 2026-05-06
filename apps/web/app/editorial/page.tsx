import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({
  title: 'Editorial',
  description: 'Jacket guides, care notes, and authenticity checks for vintage hunters.',
  path: '/editorial',
  keywords: ['editorial', 'vintage guides', 'authenticity checks'],
});

export default function EditorialPage() {
  const articles = [
    {
      title: 'Vintage Jacket Fit Guide: Shoulders, sleeves, hem',
      tag: 'Fit Guide',
      readTime: '5 min read',
      summary: 'Check shoulder seam drop, sleeve stack, and hem hit before you buy.',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'How to Spot a Fake Moncler Jacket',
      tag: 'Checks',
      readTime: '4 min read',
      summary: 'Inspect cartoon label, zipper pulls, NFC/QR, and fill weight.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Stone Island Badge Checks: Stitching and buttons',
      tag: 'Checks',
      readTime: '3 min read',
      summary: 'Look for tight embroidery, clean compass points, and matte buttons.',
      image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Wash a Puffer Without Killing Loft',
      tag: 'Care',
      readTime: '4 min read',
      summary: 'Cold wash, tennis balls in dryer, and no fabric softener.',
      image: 'https://images.unsplash.com/photo-1542718610-5e590c302f19?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Leather Jacket Care: Conditioning and storage',
      tag: 'Care',
      readTime: '5 min read',
      summary: 'Condition twice a year, avoid heat, and store on wide hangers.',
      image: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Denim Jacket Fades: What real aging looks like',
      tag: 'Guide',
      readTime: '3 min read',
      summary: 'Natural whiskers and honeycombs beat uniform stonewash.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'M-65 Field Jacket Guide: Liners, tags, hardware',
      tag: 'Archive',
      readTime: '4 min read',
      summary: 'Check contract labels, hood stow pocket, and brass snaps.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Best Vintage Workwear Jackets to Start With',
      tag: 'Brand',
      readTime: '4 min read',
      summary: 'Carhartt, Dickies, and Wrangler bring tough canvas and clean fits.',
      image: 'https://images.unsplash.com/photo-1569937726758-3c26d6d2f76d?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Quick Repairs: Fix a torn lining at home',
      tag: 'Fix',
      readTime: '3 min read',
      summary: 'Use iron-on patches, ladder stitch, and keep seams flat.',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Sizing Bomber Jackets: MA-1 vs varsity',
      tag: 'Fit Guide',
      readTime: '3 min read',
      summary: 'Boxy shoulders, shorter hems, and room for layering.',
      image: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Rainwear Checks: DWR, taped seams, odor',
      tag: 'Checks',
      readTime: '3 min read',
      summary: 'Test bead-off, inspect seam tape, and check for mildew.',
      image: 'https://images.unsplash.com/photo-1582719478248-54e9f2af604c?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: '3-Step Styling: Let the jacket lead',
      tag: 'Style',
      readTime: '2 min read',
      summary: 'Mute the rest, balance proportions, and finish with clean denim.',
      image: 'https://images.unsplash.com/photo-1496747611180-206a5c8c58c6?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={[
          collectionSchema({
            title: 'Roorq Editorial',
            description: 'Jacket guides, care notes, and authenticity checks for vintage hunters.',
            path: '/editorial',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Editorial', path: '/editorial' },
          ]),
        ]}
      />
      <Navbar />
      <main className="flex-1">
        <div className="py-16 px-4 text-center border-b border-gray-100 bg-gray-50">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-black mb-3">Roorq Editorial</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">The Edit</h1>
          <p className="text-base md:text-lg uppercase tracking-[0.2em] font-mono text-gray-500">
            Jacket guides, care notes, and authenticity checks for vintage hunters
          </p>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, idx) => (
              <article
                key={idx}
                className="group relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                      <span className="bg-white/15 px-2 py-1 rounded-full border border-white/20">{article.tag}</span>
                      <span>{article.readTime}</span>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-xs text-white/80 leading-snug">
                        {article.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
