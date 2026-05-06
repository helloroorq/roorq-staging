import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDropsPage() {
  const supabase = await createClient();

  const { data: drops } = await supabase
    .from('drops')
    .select('*')
    .order('scheduled_at', { ascending: false });

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Drops</h1>
        <Link href="/admin/drops/new" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">
            Create New Drop
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {drops && drops.length > 0 ? (
              drops.map((drop) => (
                <tr key={drop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{drop.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                      drop.status === 'live' ? 'bg-red-100 text-red-800' :
                      drop.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      drop.status === 'ended' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {drop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(drop.scheduled_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/admin/drops/${drop.id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No drops created yet. Create your first drop to get started.
                </td>
              </tr>
            )}
            </tbody>
          </table>
      </div>
    </div>
  );
}
