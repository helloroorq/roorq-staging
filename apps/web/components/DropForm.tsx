'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface DropFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    scheduled_at?: string | null;
    status?: string | null;
  };
}

export default function DropForm({ initialData }: DropFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    scheduled_at: initialData?.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : '',
    status: initialData?.status || 'draft',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
      };

      if (initialData) {
        const { error } = await supabase
          .from('drops')
          .update(dataToSubmit)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Drop updated successfully');
      } else {
        const { error } = await supabase
          .from('drops')
          .insert(dataToSubmit);
        if (error) throw error;
        toast.success('Drop created successfully');
      }

      // Use replace to prevent back button issues, remove refresh to avoid session issues
      router.replace('/admin/drops');
    } catch (error: unknown) {
      logger.error('Error saving drop', error instanceof Error ? error : undefined);
      const message = error instanceof Error ? error.message : 'Failed to save drop';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6 max-w-2xl mx-auto">
      <div>
        <label className="block text-sm font-bold uppercase mb-2">Drop Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-bold uppercase mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full border border-gray-300 p-3 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-bold uppercase mb-2">Scheduled Date & Time</label>
        <input
          type="datetime-local"
          name="scheduled_at"
          value={formData.scheduled_at}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-3 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-bold uppercase mb-2">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded"
        >
          <option value="draft">Draft</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {initialData ? 'Update Drop' : 'Create Drop'}
        </button>
      </div>
    </form>
  );
}
