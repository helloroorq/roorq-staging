'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

const DOCS = [
  { label: 'PAN Card', type: 'pan_card' },
  { label: 'GST Certificate', type: 'gst_certificate' },
  { label: 'Bank Proof', type: 'bank_proof' },
  { label: 'Address Proof', type: 'address_proof' },
  { label: 'Identity Proof', type: 'identity_proof' },
  { label: 'Business Registration', type: 'business_registration' },
] as const

export default function SellerDocumentsPage() {
  const [loading, setLoading] = useState(false)

  const handleUpload = async (docType: typeof DOCS[number]['type'], file?: File) => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('docType', docType)
      formData.append('file', file)
      formData.append('persist', 'true')

      const res = await fetch('/api/storage/vendor-documents', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Upload failed')
      }

      toast.success('Document uploaded')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {DOCS.map((doc) => (
          <div key={doc.type} className="border bg-white p-4 rounded-lg shadow">
            <p className="font-semibold mb-2">{doc.label}</p>
            <input
              type="file"
              accept="image/*,application/pdf"
              disabled={loading}
              onChange={(e) => handleUpload(doc.type, e.target.files?.[0])}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
