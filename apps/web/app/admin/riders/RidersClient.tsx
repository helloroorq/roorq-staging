'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export type RiderRow = {
  id: string
  name: string
  phone: string
  is_active: boolean
  created_at: string
}

export default function RidersClient() {
  const supabase = useMemo(() => createClient(), [])
  const [riders, setRiders] = useState<RiderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const fetchRiders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }
      setRiders((data as RiderRow[]) ?? [])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load riders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRiders()
  }, [fetchRiders])

  const addRider = useCallback(async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('riders').insert({
        name: name.trim(),
        phone: phone.trim(),
        is_active: true,
      } as never)

      if (error) {
        throw error
      }

      toast.success('Rider added')
      setName('')
      setPhone('')
      await fetchRiders()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add rider')
    } finally {
      setSaving(false)
    }
  }, [fetchRiders, name, phone, supabase])

  const toggleRider = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        const { error } = await supabase
          .from('riders')
          .update({ is_active: !isActive } as never)
          .eq('id', id)

        if (error) {
          throw error
        }
        setRiders((current) =>
          current.map((rider) =>
            rider.id === id ? { ...rider, is_active: !isActive } : rider
          )
        )
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to update rider')
      }
    },
    [supabase]
  )

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-4xl font-bold">Riders</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rider name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
          <button
            type="button"
            onClick={addRider}
            disabled={saving}
            className="bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Rider'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                    Loading riders...
                  </td>
                </tr>
              ) : riders.length > 0 ? (
                riders.map((rider) => (
                  <tr key={rider.id}>
                    <td className="px-6 py-4 font-medium">{rider.name}</td>
                    <td className="px-6 py-4">{rider.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          rider.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rider.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleRider(rider.id, rider.is_active)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {rider.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                    No riders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

