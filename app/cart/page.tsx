'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/components/providers/AuthProvider';

interface CartItem {
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock_quantity: number;
    reserved_quantity: number;
  };
}

type ProductRow = NonNullable<CartItem['product']>;

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const loadCart = useCallback(async () => {
    try {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      
      if (cartData.length === 0) {
        setCart([]);
        setLoading(false);
        return;
      }
    
      const productIds = Array.from(new Set(cartData.map((item: CartItem) => item.productId)));
      const { data: productRows, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      if (productsError) {
        logger.error('Failed to load cart products', productsError instanceof Error ? productsError : undefined);
        throw productsError;
      }

      const productMap = new Map(
        ((productRows ?? []) as ProductRow[]).map((product) => [product.id, product])
      );
      let hasChanges = false;

      const validProducts = cartData.reduce<CartItem[]>((acc, item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          logger.warn(`Product ${item.productId} not found or inactive`);
          hasChanges = true;
          return acc;
        }

        const availableStock = product.stock_quantity - product.reserved_quantity;
        if (availableStock <= 0) {
          toast.error(`${product.name} is out of stock`);
          hasChanges = true;
          return acc;
        }

        let nextQuantity = item.quantity;
        if (nextQuantity > availableStock) {
          toast(`${product.name}: Only ${availableStock} available. Quantity adjusted.`, { icon: '⚠️' });
          nextQuantity = availableStock;
          hasChanges = true;
        }

        acc.push({
          ...item,
          quantity: nextQuantity,
          product,
        });
        return acc;
      }, []);

      setCart(validProducts);
      
      // Update localStorage with valid items only
      if (hasChanges || validProducts.length !== cartData.length) {
        localStorage.setItem('cart', JSON.stringify(validProducts.map(({ product, ...item }) => item)));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error: unknown) {
      logger.error('Error loading cart', error instanceof Error ? error : undefined);
      toast.error('Failed to load cart. Please refresh the page.');
    } finally {
    setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const updateQuantity = (productId: string, delta: number) => {
    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        // Check stock availability
        const availableStock = (item.product?.stock_quantity || 0) - (item.product?.reserved_quantity || 0);
        if (newQuantity > availableStock) {
          toast.error(`Only ${availableStock} items available in stock`);
          return item; // Don't update if exceeds stock
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart.map(({ product, ...item }) => item)));
    // Dispatch event to update cart count in Navbar
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart.map(({ product, ...item }) => item)));
    // Dispatch event to update cart count in Navbar
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link
              href="/shop"
              className="inline-block bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 border-b pb-4"
                >
                  {item.product?.images && item.product.images.length > 0 && (
                    <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.product?.name}</h3>
                    <p className="text-gray-600 mb-2">₹{item.product?.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg sticky top-20">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>
                
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {authLoading ? (
                  <div className="block w-full bg-gray-200 text-gray-500 text-center py-3 rounded font-semibold mb-2">
                    Checking account...
                  </div>
                ) : !user ? (
                  <Link
                    href="/auth?redirect=/cart"
                    className="block w-full bg-black text-white text-center py-3 rounded font-semibold hover:bg-gray-800 transition mb-2"
                  >
                    Sign In to Checkout
                  </Link>
                ) : (
                  <Link
                    href="/checkout"
                    className="block w-full bg-black text-white text-center py-3 rounded font-semibold hover:bg-gray-800 transition"
                  >
                    Proceed to Checkout
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
