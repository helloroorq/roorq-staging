'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

type SellerProfileRow = {
  store_name: string | null
  store_description: string | null
  store_logo_url: string | null
  store_banner_url: string | null
  business_name: string | null
  business_category: string | null
  business_email: string | null
  business_phone: string | null
}

export default function SellerProfileSettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [csrf, setCsrf] = useState('')
  const [form, setForm] = useState({
    storeName: '',
    storeDescription: '',
    storeLogoUrl: '',
    storeBannerUrl: '',
    businessName: '',
    businessCategory: '',
    businessEmail: '',
    businessPhone: '',
  })

  useEffect(() => {
    setCsrf(getOrCreateCsrfToken())
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data } = await supabase
        .from('users')
        .select('store_name, store_description, store_logo_url, store_banner_url, business_name, business_category, business_email, business_phone')
        .eq('id', auth.user.id)
        .single()

      if (data) {
        const typedData = data as SellerProfileRow
        setForm({
          storeName: typedData.store_name ?? '',
          storeDescription: typedData.store_description ?? '',
          storeLogoUrl: typedData.store_logo_url ?? '',
          storeBannerUrl: typedData.store_banner_url ?? '',
          businessName: typedData.business_name ?? '',
          businessCategory: typedData.business_category ?? '',
          businessEmail: typedData.business_email ?? '',
          businessPhone: typedData.business_phone ?? '',
        })
      }
    }
    load()
  }, [supabase])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csrf) {
      toast.error('Security token missing. Please refresh.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          storeLogoUrl: form.storeLogoUrl || null,
          storeBannerUrl: form.storeBannerUrl || null,
          csrf,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      toast.success('Profile updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold">Store Profile</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Store name</label>
          <input className="w-full border px-4 py-3" value={form.storeName} onChange={(e) => handleChange('storeName', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business name</label>
          <input className="w-full border px-4 py-3" value={form.businessName} onChange={(e) => handleChange('businessName', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business category</label>
          <input className="w-full border px-4 py-3" value={form.businessCategory} onChange={(e) => handleChange('businessCategory', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business email</label>
          <input className="w-full border px-4 py-3" value={form.businessEmail} onChange={(e) => handleChange('businessEmail', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business phone</label>
          <input className="w-full border px-4 py-3" value={form.businessPhone} onChange={(e) => handleChange('businessPhone', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Store logo URL</label>
          <input className="w-full border px-4 py-3" value={form.storeLogoUrl} onChange={(e) => handleChange('storeLogoUrl', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Store banner URL</label>
          <input className="w-full border px-4 py-3" value={form.storeBannerUrl} onChange={(e) => handleChange('storeBannerUrl', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Store description</label>
          <textarea className="w-full border px-4 py-3" rows={4} value={form.storeDescription} onChange={(e) => handleChange('storeDescription', e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="bg-black text-white px-6 py-2 font-bold uppercase text-sm disabled:opacity-50">
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
