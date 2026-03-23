'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client';
import { useAuth } from '@/components/providers/AuthProvider';

interface CartItem {
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
  };
}

type UserProfile = {
  full_name: string | null;
  hostel: string | null;
  room_number: string | null;
  phone: string | null;
  first_cod_done?: boolean | null;
};

type CheckoutItemPayload = {
  productId: string;
  quantity: number;
};

type CheckoutRequest = {
  items: CheckoutItemPayload[];
  deliveryHostel: string;
  deliveryRoom: string;
  phone: string;
  paymentMethod: 'cod' | 'upi' | 'card';
  csrf: string;
};

type CheckoutSuccessResponse = {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
};

type CheckoutErrorResponse = {
  error: string;
  details?: string[];
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
};

const isCheckoutSuccess = (
  data: CheckoutSuccessResponse | CheckoutErrorResponse
): data is CheckoutSuccessResponse => "orderId" in data;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // PHASE 1: COD Only - UPI disabled
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [csrfToken, setCsrfToken] = useState('');
  const [formData, setFormData] = useState({
    hostel: '',
    roomNumber: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
          logger.error('Profile load error', profileError instanceof Error ? profileError : undefined);
          // Don't block, just don't prefill
      }

      if (profile) {
        const typedProfile = profile as UserProfile;
        setUserProfile(typedProfile);
        setFormData({
          hostel: typedProfile.hostel || '',
          roomNumber: typedProfile.room_number || '',
          phone: typedProfile.phone || '',
        });
      }

      // Load cart
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (cartData.length === 0) {
          setLoading(false);
          return;
      }

      const productIds = Array.from(
        new Set(cartData.map((item: CartItem) => item.productId))
      );

      const { data: productRows, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);

      if (productsError) {
        logger.error('Failed to load products', productsError instanceof Error ? productsError : undefined);
      }

      const productMap = new Map(
        ((productRows ?? []) as ProductRow[]).map((product) => [product.id, product])
      );

      const merged = cartData
        .map((item: CartItem) => ({
          ...item,
          product: productMap.get(item.productId),
        }))
        .filter((item: CartItem) => !!item.product);

      setCart(merged);
    } catch (err: unknown) {
        logger.error('Checkout load error', err instanceof Error ? err : undefined);
        setError('Failed to load checkout data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/auth?redirect=/checkout');
      return;
    }

    void loadData();
  }, [authLoading, loadData, router, user]);

  useEffect(() => {
    setCsrfToken(getOrCreateCsrfToken());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!user) {
      toast.error('Please sign in to continue.');
      router.push('/auth?redirect=/checkout');
      return;
    }

    if (!csrfToken) {
      toast.error('Security token missing. Please refresh.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: CheckoutRequest = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryHostel: formData.hostel.trim(),
        deliveryRoom: formData.roomNumber.trim(),
        phone: formData.phone.trim(),
        paymentMethod,
        csrf: csrfToken,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CheckoutSuccessResponse | CheckoutErrorResponse;

      if (!response.ok) {
        const message = 'error' in data ? data.error : 'Failed to place order.';
        toast.error(message);
        setSubmitting(false);
        return;
      }

      if (!isCheckoutSuccess(data)) {
        throw new Error('Invalid checkout response');
      }

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      router.push(`/orders/${data.orderId}`);
    } catch (error: unknown) {
      logger.error('Checkout error', error instanceof Error ? error : undefined);
      toast.error('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  // PHASE 1: COD Only - UPI disabled
  const showUPI = false; // userProfile?.first_cod_done === true;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Checkout Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-black text-white px-6 py-2 rounded font-bold uppercase">Retry</button>
                </div>
            </div>
            <Footer />
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-black uppercase tracking-wide mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" /> Delivery Details
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase text-xs tracking-widest mb-2">Hostel / Bhawan</label>
                    <input
                      type="text"
                      required
                      value={formData.hostel}
                      onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black outline-none font-medium transition-colors"
                      placeholder="e.g. Rajendra Bhawan"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-xs tracking-widest mb-2">Room Number</label>
                    <input
                      type="text"
                      required
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black outline-none font-medium transition-colors"
                      placeholder="e.g. A-201"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-xs tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-black outline-none font-medium transition-colors"
                    placeholder="+91 9876543210"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for delivery coordination only.</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-black uppercase tracking-wide mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6" /> Payment Method
              </h2>
              
              <div className="space-y-4">
                <label 
                  className={`flex items-start p-4 border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 hover:border-black'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 mr-4 accent-white"
                  />
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-widest flex items-center gap-2">
                      <Banknote className="w-5 h-5" /> Cash on Delivery (COD)
                    </div>
                    <div className={`text-sm mt-1 ${paymentMethod === 'cod' ? 'text-gray-300' : 'text-gray-500'}`}>
                      Pay cash or UPI when the rider arrives at your hostel.
                    </div>
                  </div>
                </label>

                {/* PHASE 1: COD Only - UPI payment option commented out */}
                {/* <label 
                  className={`flex items-start p-4 border-2 transition-all ${
                    !showUPI 
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                      : paymentMethod === 'upi'
                        ? 'border-black bg-black text-white cursor-pointer'
                        : 'border-gray-200 hover:border-black cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => showUPI && setPaymentMethod('upi')}
                    disabled={!showUPI}
                    className="mt-1 mr-4 accent-white"
                  />
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> UPI / Online Payment
                    </div>
                    <div className={`text-sm mt-1 ${
                      !showUPI 
                        ? 'text-gray-500' 
                        : paymentMethod === 'upi' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {!showUPI 
                        ? 'Unlocks after your first successful COD delivery.' 
                        : 'Instant payment via UPI apps (GPay, PhonePe, Paytm).'}
                    </div>
                  </div>
                </label> */}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-black p-6 sticky top-24 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-black uppercase tracking-wide mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold">{item.product?.name}</p>
                      <p className="text-gray-500 text-xs uppercase">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold">{formatINR((item.product?.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t-2 border-black pt-4 mb-6">
                <div className="flex justify-between text-xl font-black uppercase">
                  <span>Total</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !csrfToken}
                className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  'Place Order' // PHASE 1: COD Only - Always "Place Order"
                )}
              </button>
              
              <p className="text-center text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                Secure Checkout • 24h Delivery
              </p>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
