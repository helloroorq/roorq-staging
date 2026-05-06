'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

type CartItem = {
  productId: string;
  quantity: number;
};

export default function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      // Cart stays local; authentication is enforced at checkout.
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];

      const existingItem = cart.find((item) => item.productId === productId);

      if (existingItem) {
        existingItem.quantity += 1;
        toast.success('Updated quantity in cart');
      } else {
        cart.push({ productId, quantity: 1 });
        toast.success('Added to cart!');
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error: unknown) {
      logger.error('Error adding to cart', error instanceof Error ? error : undefined);
      toast.error('Failed to add to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className={`w-full py-4 px-6 font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : added
          ? 'bg-green-600 text-white'
          : loading
          ? 'bg-gray-800 text-white cursor-wait'
          : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Adding...
        </>
      ) : added ? (
        <>
          <Check className="w-5 h-5" />
          Added!
        </>
      ) : disabled ? (
        'Out of Stock'
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </button>
  );
}
