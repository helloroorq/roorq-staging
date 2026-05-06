'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

type BankingSettingsRow = {
  bank_account_number: string | null
  bank_ifsc: string | null
  bank_account_name: string | null
  upi_id: string | null
}

export default function SellerBankingPage() {
  const supabase = useMemo(() => createClient(), [])
  const [csrf, setCsrf] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    bankAccountNumber: '',
    bankIfsc: '',
    bankAccountName: '',
    upiId: '',
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
        .select('bank_account_number, bank_ifsc, bank_account_name, upi_id')
        .eq('id', auth.user.id)
        .single()
      if (data) {
        const typedData = data as BankingSettingsRow
        setForm({
          bankAccountNumber: typedData.bank_account_number ?? '',
          bankIfsc: typedData.bank_ifsc ?? '',
          bankAccountName: typedData.bank_account_name ?? '',
          upiId: typedData.upi_id ?? '',
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
      const res = await fetch('/api/vendor/banking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, csrf }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update banking')
      toast.success('Banking updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update banking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold">Banking Details</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Account number</label>
          <input className="w-full border px-4 py-3" value={form.bankAccountNumber} onChange={(e) => handleChange('bankAccountNumber', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">IFSC</label>
          <input className="w-full border px-4 py-3" value={form.bankIfsc} onChange={(e) => handleChange('bankIfsc', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Account name</label>
          <input className="w-full border px-4 py-3" value={form.bankAccountName} onChange={(e) => handleChange('bankAccountName', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">UPI ID</label>
          <input className="w-full border px-4 py-3" value={form.upiId} onChange={(e) => handleChange('upiId', e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="bg-black text-white px-6 py-2 font-bold uppercase text-sm disabled:opacity-50">
        {loading ? 'Saving...' : 'Save banking'}
      </button>
    </form>
  )
}
