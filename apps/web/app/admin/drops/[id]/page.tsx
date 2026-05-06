import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import DropForm from '@/components/DropForm';

export default async function EditDropPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: drop } = await supabase
    .from('drops')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!drop) notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Drop</h1>
      <DropForm initialData={drop} />
    </div>
  );
}
