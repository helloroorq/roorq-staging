import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DropForm from '@/components/DropForm';

export default async function NewDropPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create New Drop</h1>
      <DropForm />
    </div>
  );
}
