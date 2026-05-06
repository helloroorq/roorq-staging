'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

type DocumentState = {
  documentType: 'pan_card' | 'gst_certificate' | 'bank_proof' | 'address_proof' | 'identity_proof' | 'business_registration'
  documentUrl: string
  documentNumber?: string
}

const steps = ['Account', 'Business', 'Legal', 'Banking', 'Documents']

export default function VendorSignupPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [csrf, setCsrf] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [documents, setDocuments] = useState<DocumentState[]>([])
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    businessName: '',
    businessType: 'individual',
    businessCategory: '',
    businessEmail: '',
    businessPhone: '',
    panNumber: '',
    gstin: '',
    storeName: '',
    storeDescription: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankAccountName: '',
    upiId: '',
    pickupAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
    },
    returnAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
    },
  })

  useEffect(() => {
    setCsrf(getOrCreateCsrfToken())
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth?redirect=/sell/signup')
        return
      }
      setUserEmail(data.user.email ?? '')
    }
    load()
  }, [router, supabase])

  useEffect(() => {
    const saved = localStorage.getItem('roorq_vendor_signup')
    if (saved) {
      const parsed = JSON.parse(saved)
      setForm((prev) => parsed.form ?? prev)
      setDocuments(parsed.documents ?? [])
      setStep(parsed.step ?? 0)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('roorq_vendor_signup', JSON.stringify({ form, documents, step }))
  }, [form, documents, step])

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateAddress = (type: 'pickupAddress' | 'returnAddress', field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }

  const handleFileUpload = useCallback(
    async (docType: DocumentState['documentType'], file: File, documentNumber?: string) => {
      if (!file) return
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        toast.error('Please sign in again.')
        return
      }
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('docType', docType)
        formData.append('file', file)
        if (documentNumber) {
          formData.append('documentNumber', documentNumber)
        }

        const res = await fetch('/api/storage/vendor-documents', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Upload failed')
        }

        const documentUrl = data?.publicUrl || data?.path
        if (!documentUrl) {
          throw new Error('Failed to get file URL')
        }

        setDocuments((prev) => {
          const filtered = prev.filter((doc) => doc.documentType !== docType)
          return [...filtered, { documentType: docType, documentUrl, documentNumber }]
        })
        toast.success('Document uploaded')
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const handleSubmit = async () => {
    if (!csrf) {
      toast.error('Security token missing. Please refresh.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        businessEmail: form.businessEmail || userEmail,
        businessPhone: form.businessPhone || form.phone,
        documents,
        csrf,
      }

      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vendor application')
      }

      toast.success('Application submitted')
      localStorage.removeItem('roorq_vendor_signup')
      router.replace('/seller/onboarding')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-3">Seller Registration</h1>
        <p className="text-gray-600 mb-8">Complete your seller profile to get approved.</p>

        <div className="flex items-center gap-3 mb-8">
          {steps.map((label, idx) => (
            <div key={label} className={`flex-1 h-1 rounded-full ${idx <= step ? 'bg-black' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Full name</label>
              <input className="w-full border px-4 py-3" value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Email</label>
              <input className="w-full border px-4 py-3 bg-gray-50" value={userEmail} readOnly />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Phone</label>
              <input className="w-full border px-4 py-3" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business name</label>
              <input className="w-full border px-4 py-3" value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business type</label>
                <select className="w-full border px-4 py-3" value={form.businessType} onChange={(e) => updateForm('businessType', e.target.value)}>
                  <option value="individual">Individual</option>
                  <option value="proprietorship">Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="pvt_ltd">Pvt Ltd</option>
                  <option value="llp">LLP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Category</label>
                <input className="w-full border px-4 py-3" value={form.businessCategory} onChange={(e) => updateForm('businessCategory', e.target.value)} placeholder="vintage fashion" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business email</label>
              <input className="w-full border px-4 py-3" value={form.businessEmail} onChange={(e) => updateForm('businessEmail', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Business phone</label>
              <input className="w-full border px-4 py-3" value={form.businessPhone} onChange={(e) => updateForm('businessPhone', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">PAN number</label>
              <input className="w-full border px-4 py-3" value={form.panNumber} onChange={(e) => updateForm('panNumber', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">GSTIN (optional)</label>
              <input className="w-full border px-4 py-3" value={form.gstin} onChange={(e) => updateForm('gstin', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Store name</label>
              <input className="w-full border px-4 py-3" value={form.storeName} onChange={(e) => updateForm('storeName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Store description</label>
              <textarea className="w-full border px-4 py-3" rows={4} value={form.storeDescription} onChange={(e) => updateForm('storeDescription', e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Bank account number</label>
              <input className="w-full border px-4 py-3" value={form.bankAccountNumber} onChange={(e) => updateForm('bankAccountNumber', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">IFSC</label>
                <input className="w-full border px-4 py-3" value={form.bankIfsc} onChange={(e) => updateForm('bankIfsc', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Account name</label>
                <input className="w-full border px-4 py-3" value={form.bankAccountName} onChange={(e) => updateForm('bankAccountName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">UPI ID (optional)</label>
              <input className="w-full border px-4 py-3" value={form.upiId} onChange={(e) => updateForm('upiId', e.target.value)} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2">Pickup address</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="border px-4 py-3" placeholder="Line 1" value={form.pickupAddress.line1} onChange={(e) => updateAddress('pickupAddress', 'line1', e.target.value)} />
                <input className="border px-4 py-3" placeholder="Line 2" value={form.pickupAddress.line2} onChange={(e) => updateAddress('pickupAddress', 'line2', e.target.value)} />
                <input className="border px-4 py-3" placeholder="City" value={form.pickupAddress.city} onChange={(e) => updateAddress('pickupAddress', 'city', e.target.value)} />
                <input className="border px-4 py-3" placeholder="State" value={form.pickupAddress.state} onChange={(e) => updateAddress('pickupAddress', 'state', e.target.value)} />
                <input className="border px-4 py-3" placeholder="Postal Code" value={form.pickupAddress.postalCode} onChange={(e) => updateAddress('pickupAddress', 'postalCode', e.target.value)} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2">Documents</p>
              <div className="grid gap-4 md:grid-cols-2">
                {[{ label: 'PAN Card', type: 'pan_card' }, { label: 'Address Proof', type: 'address_proof' }, { label: 'Bank Proof', type: 'bank_proof' }].map((doc) => (
                  <div key={doc.type} className="border p-4">
                    <p className="text-sm font-semibold mb-2">{doc.label}</p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(doc.type as DocumentState['documentType'], file)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="border border-gray-300 px-5 py-2 text-sm font-bold uppercase"
            disabled={step === 0}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="bg-black text-white px-6 py-2 text-sm font-bold uppercase"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black text-white px-6 py-2 text-sm font-bold uppercase disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline-block" /> : 'Submit for review'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
