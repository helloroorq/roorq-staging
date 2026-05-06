import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/ProductForm';
import { notFound, redirect } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!product) notFound();

  const { data: drops } = await supabase
    .from('drops')
    .select('id, name')
    .neq('status', 'ended')
    .order('scheduled_at', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm initialData={product} drops={drops || []} />
    </div>
  );
}
