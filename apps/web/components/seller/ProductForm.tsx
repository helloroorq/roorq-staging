'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader2, Plus, X } from 'lucide-react'
import { logger } from '@/lib/logger'

type ProductFormInitial = {
  id: string
  name: string
  description?: string | null
  price: number
  vendor_price?: number | null
  category?: string | null
  size?: string | null
  condition?: string | null
  stock_quantity?: number | null
  images?: string[] | null
  shipping_time_days?: number | null
}

export default function VendorProductForm({ initialData }: { initialData?: ProductFormInitial }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [newImage, setNewImage] = useState('')
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price ?? '',
    vendor_price: initialData?.vendor_price ?? '',
    category: initialData?.category ?? 't-shirt',
    size: initialData?.size ?? 'M',
    condition: initialData?.condition ?? 'good',
    stock_quantity: initialData?.stock_quantity ?? 1,
    images: initialData?.images ?? [],
    shipping_time_days: initialData?.shipping_time_days ?? 3,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddImage = () => {
    if (!newImage) return
    setFormData((prev) => ({ ...prev, images: [...prev.images, newImage] }))
    setNewImage('')
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        toast.error('Please sign in')
        return
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        vendor_price: formData.vendor_price ? Number(formData.vendor_price) : null,
        category: formData.category,
        size: formData.size,
        condition: formData.condition,
        stock_quantity: Number(formData.stock_quantity),
        reserved_quantity: 0,
        images: formData.images,
        shipping_time_days: Number(formData.shipping_time_days),
      }

      if (!Number.isFinite(payload.stock_quantity) || payload.stock_quantity < 1) {
        throw new Error('Stock quantity must be at least 1')
      }

      if (initialData) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Product updated')
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...payload,
            vendor_id: auth.user.id,
            approval_status: 'pending',
            is_active: true,
            platform_price: payload.price,
          })
        if (error) throw error
        // KARMA TODO: When platform can prove "resale" (item was previously bought on Roorq), call
        // internalKarmaAward({ userId: auth.user.id, reason: 'RESALE_LISTED', referenceId: <newProductId> }).
        // Wire from a server route or background job — not from the client with the internal API key.
        toast.success('Product submitted for approval')
      }

      router.replace('/seller/products')
    } catch (error: unknown) {
      logger.error('Product save error', error instanceof Error ? error : undefined)
      toast.error(error instanceof Error ? error.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Product Name</label>
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
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase mb-2">Price (INR)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full border border-gray-300 p-3 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase mb-2">Vendor Price</label>
              <input
                type="number"
                name="vendor_price"
                value={formData.vendor_price}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 p-3 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Stock Quantity</label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full border border-gray-300 p-3 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Shipping Time (days)</label>
            <input
              type="number"
              name="shipping_time_days"
              value={formData.shipping_time_days}
              onChange={handleChange}
              required
              min="1"
              className="w-full border border-gray-300 p-3 rounded"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded">
            <option value="t-shirt">T-Shirt</option>
            <option value="jacket">Jacket</option>
            <option value="jeans">Jeans</option>
            <option value="sweater">Sweater</option>
            <option value="skirt">Skirt</option>
            <option value="trousers">Trousers</option>
            <option value="accessories">Accessories</option>
            <option value="shoes">Shoes</option>
            <option value="sportswear">Sportswear</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Size</label>
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Condition</label>
          <select name="condition" value={formData.condition} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded">
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold uppercase mb-2">Images (URLs)</label>
        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="https://..."
            className="flex-1 border border-gray-300 p-3 rounded"
          />
          <button type="button" onClick={handleAddImage} className="bg-black text-white px-4 rounded">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {formData.images.map((url: string, idx: number) => (
            <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden group">
              <Image src={url} alt={`Product image ${idx + 1}`} fill sizes="(max-width: 768px) 25vw, 10vw" className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {initialData ? 'Update Product' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  )
}
