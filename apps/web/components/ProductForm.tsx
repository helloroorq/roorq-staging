'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Drop {
  id: string;
  name: string;
}

type ProductFormInitialData = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  retail_price?: number | null;
  category?: string;
  gender?: string;
  size?: string;
  color?: string | null;
  material?: string | null;
  stock_quantity?: number;
  images?: string[];
  drop_id?: string | null;
  is_active?: boolean;
};

interface ProductFormProps {
  initialData?: ProductFormInitialData;
  drops: Drop[];
}

export default function ProductForm({ initialData, drops }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    retail_price: initialData?.retail_price || '',
    category: initialData?.category || 't-shirt',
    gender: initialData?.gender || 'unisex',
    size: initialData?.size || 'M',
    color: initialData?.color || '',
    material: initialData?.material || '',
    stock_quantity: initialData?.stock_quantity ?? 1,
    images: initialData?.images || [],
    drop_id: initialData?.drop_id || '',
    is_active: initialData?.is_active ?? true,
  });

  const [newImage, setNewImage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddImage = () => {
    if (newImage) {
      setFormData(prev => ({ ...prev, images: [...prev.images, newImage] }));
      setNewImage('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_: string, i: number) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const priceValue = Number.parseFloat(String(formData.price));
      const retailValueRaw = formData.retail_price;
      const retailValue =
        retailValueRaw === '' || retailValueRaw === null || retailValueRaw === undefined
          ? null
          : Number.parseFloat(String(retailValueRaw));
      const stockValue = Number.parseInt(String(formData.stock_quantity), 10);
      if (!Number.isFinite(stockValue) || stockValue < 1) {
        throw new Error('Stock quantity must be at least 1');
      }

      const dataToSubmit = {
        ...formData,
        price: priceValue,
        retail_price: retailValue,
        stock_quantity: stockValue,
        reserved_quantity: 0,
        drop_id: formData.drop_id || null,
      };

      if (initialData) {
        const { error } = await supabase
          .from('products')
          .update(dataToSubmit)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(dataToSubmit);
        if (error) throw error;
        toast.success('Product created successfully');
      }

      // Use replace to prevent back button issues, remove refresh to avoid session issues
      router.replace('/admin/products');
    } catch (error: unknown) {
      logger.error('Error saving product', error instanceof Error ? error : undefined);
      const message = error instanceof Error ? error.message : 'Failed to save product';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Name</label>
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

        {/* Pricing & Stock */}
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
              <label className="block text-sm font-bold uppercase mb-2">MRP (Optional)</label>
              <input
                type="number"
                name="retail_price"
                value={formData.retail_price}
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
        </div>
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded"
          >
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
          <label className="block text-sm font-bold uppercase mb-2">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded"
          >
            <option value="unisex">Unisex</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Size</label>
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleChange}
            placeholder="e.g. M, L, XL, 32, 9"
            className="w-full border border-gray-300 p-3 rounded"
          />
        </div>
      </div>

      {/* Drop Selection */}
      <div>
        <label className="block text-sm font-bold uppercase mb-2">Assign to Drop</label>
        <select
          name="drop_id"
          value={formData.drop_id}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded"
        >
          <option value="">No Drop (Immediate Release)</option>
          {drops.map(drop => (
            <option key={drop.id} value={drop.id}>{drop.name}</option>
          ))}
        </select>
      </div>

      {/* Images */}
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
          <button
            type="button"
            onClick={handleAddImage}
            className="bg-black text-white px-4 rounded hover:bg-gray-800"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {formData.images.map((url: string, idx: number) => (
            <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden group">
              <Image
                src={url}
                alt={`Product image ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 25vw, 10vw"
                className="object-cover"
              />
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

      {/* Submit */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {initialData ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
