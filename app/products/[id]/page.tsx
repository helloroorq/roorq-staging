import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import AddToCartButton from '@/components/AddToCartButton';
import StartConversationButton from '@/components/messages/StartConversationButton';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, productSchema } from '@/lib/seo/schema';
import { formatINR } from '@/lib/utils/currency';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, ShieldCheck, Truck, RefreshCcw, Ruler } from 'lucide-react';
import { logger } from '@/lib/logger';
import { fetchApprovedStoreById } from '@/lib/marketplace/public';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getProduct = async (id: string) => {
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .maybeSingle();

  if (error) {
    logger.error('Product detail query failed', {
      productId: id,
      message: error.message,
      code: error.code,
    });
  }

  return product;
};

const getStore = async (vendorId: string | null | undefined) => {
  if (!vendorId) {
    return null;
  }

  return fetchApprovedStoreById(vendorId);
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return buildMetadata({
      title: 'Product not found',
      description: 'The requested product could not be found.',
      path: `/products/${params.id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: product.name,
    description: product.description || 'Vintage fashion item from Roorq.',
    path: `/products/${product.id}`,
    image: product.images?.[0],
    keywords: [product.name, product.category, product.brand].filter(Boolean) as string[],
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const savings = product.retail_price 
    ? Math.round(((product.retail_price - product.price) / product.retail_price) * 100)
    : 0;

  const availableStock = product.stock_quantity - product.reserved_quantity;
  const store = await getStore(product.vendor_id);
  const storeName = store?.store_name || store?.business_name;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <StructuredData
        data={[
          productSchema({
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images,
            price: product.price,
            brand: product.brand,
            category: product.category,
            inStock: availableStock > 0,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: product.name, path: `/products/${product.id}` },
          ]),
        ]}
      />
      <Navbar />
      
      <div className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
          <a href="/" className="hover:text-black">Home</a> / <a href="/shop" className="hover:text-black">Shop</a> / <span className="text-black">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Product Images - Gallery Style */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <>
                <div className="relative aspect-[3/4] bg-gray-50 border border-gray-100 overflow-hidden group">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  {/* Badge */}
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest">
                    Vintage
                  </div>
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {product.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square bg-gray-50 border border-gray-100 cursor-pointer hover:border-black transition-colors">
                        <Image
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-400 font-mono text-sm uppercase tracking-widest">
                No Image Available
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="border-b border-gray-100 pb-8 mb-8">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
                {product.name}
              </h1>
              
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                    <span className="text-3xl font-black tracking-tight">{formatINR(product.price)}</span>
                    {product.retail_price && product.retail_price > product.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-gray-400 line-through decoration-1">
                          {formatINR(product.retail_price)}
                        </span>
                        <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-black uppercase tracking-widest">
                          -{savings}%
                        </span>
                      </div>
                    )}
                 </div>
                 {/* Brand Badge */}
                 {product.brand && (
                   <span className="border border-black px-3 py-1 text-xs font-bold uppercase tracking-widest">
                     {product.brand}
                   </span>
                 )}
              </div>

              {/* Size Display */}
              <div className="bg-gray-50 p-6 border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold uppercase tracking-widest">Size</span>
                  <Link href="/sizing" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide underline text-gray-500 hover:text-black">
                    <Ruler className="w-3 h-3" /> Size Guide
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex items-center justify-center bg-black text-white text-lg font-bold border-2 border-black">
                    {product.size}
                  </div>
                  <span className="text-xs text-gray-500 font-mono uppercase">
                    Single Item in Stock
                  </span>
                </div>
              </div>

              {store && storeName && (
                <div className="mb-8 border border-gray-100 bg-white p-6">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">
                    Sold by
                  </p>
                  <Link
                    href={`/stores/${store.id}`}
                    className="inline-flex items-center gap-3 text-lg font-black uppercase tracking-wide hover:text-gray-600"
                  >
                    {storeName}
                  </Link>
                  {store.store_description && (
                    <p className="mt-3 text-xs font-mono uppercase tracking-wide text-gray-500">
                      {store.store_description}
                    </p>
                  )}
                </div>
              )}

              {/* Add to Cart */}
              <div className="mb-8">
                <div className="space-y-3">
                  <AddToCartButton 
                    productId={product.id} 
                    disabled={availableStock === 0}
                  />
                  {product.vendor_id && (
                    <StartConversationButton
                      sellerId={product.vendor_id}
                      productId={product.id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-gray-300 hover:bg-gray-50"
                    />
                  )}
                </div>
                {availableStock === 0 && (
                   <p className="mt-2 text-red-600 text-xs font-bold uppercase tracking-widest text-center">
                     Sold Out
                   </p>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Authentic</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Verified by our experts for authenticity and quality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">24h Delivery</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Direct to your hostel within 24 hours.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCcw className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Cleaned</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Professionally laundered and ready to wear.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Easy Returns</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Hassle-free returns within 48 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed font-mono text-xs">
                {product.description || "No description available for this item."}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs font-mono uppercase text-gray-500">
                <div><span className="font-bold text-black">Material:</span> {product.material || 'N/A'}</div>
                <div><span className="font-bold text-black">Color:</span> {product.color || 'N/A'}</div>
                <div><span className="font-bold text-black">Category:</span> {product.category}</div>
                <div><span className="font-bold text-black">Condition:</span> Excellent Vintage</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
