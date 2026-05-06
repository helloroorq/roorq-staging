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
import { clampSpendableCredits, computeMaxDiscountCredits, creditsToINR } from '@/lib/karma/helpers';

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
  karma_balance?: number | null;
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
  karmaCreditsToSpend: number;
  csrf: string;
};

type CheckoutCodSuccessResponse = {
  mode: 'cod';
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  karmaApplied?: {
    creditsUsed: number;
    discountAmount: number;
  };
};

type CheckoutOnlineSuccessResponse = {
  mode: 'online';
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  karmaApplied?: {
    creditsUsed: number;
    discountAmount: number;
  };
  paymentGateway: {
    provider: 'razorpay';
    keyId: string;
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
  };
};

type CheckoutErrorResponse = {
  error: string;
  details?: string[];
};

type PaymentVerificationSuccessResponse = {
  verified: true;
  orderId: string;
  paymentStatus: 'paid' | 'pending';
};

type PaymentVerificationErrorResponse = {
  verified: false;
  error: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
};

const isCheckoutSuccess = (
  data: CheckoutCodSuccessResponse | CheckoutOnlineSuccessResponse | CheckoutErrorResponse
): data is CheckoutCodSuccessResponse | CheckoutOnlineSuccessResponse =>
  'orderId' in data && 'mode' in data;

const isOnlineCheckoutSuccess = (
  data: CheckoutCodSuccessResponse | CheckoutOnlineSuccessResponse
): data is CheckoutOnlineSuccessResponse => data.mode === 'online';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');
  const [karmaCreditsToSpend, setKarmaCreditsToSpend] = useState(0);
  const [applyKarmaCredits, setApplyKarmaCredits] = useState(false);
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
        setKarmaCreditsToSpend(0);
        setApplyKarmaCredits(false);
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

  const loadRazorpaySdk = useCallback(async (): Promise<boolean> => {
    if (window.Razorpay) {
      return true;
    }

    return await new Promise((resolve) => {
      const existingScript = document.getElementById('razorpay-checkout-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-checkout-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const verifyGatewayPayment = useCallback(
    async (
      checkoutResponse: CheckoutOnlineSuccessResponse,
      razorpayPaymentId: string,
      razorpaySignature: string
    ) => {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentOrderId: checkoutResponse.orderId,
          razorpayOrderId: checkoutResponse.paymentGateway.razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          csrf: csrfToken,
        }),
      });

      const data = (await response.json()) as
        | PaymentVerificationSuccessResponse
        | PaymentVerificationErrorResponse;

      if (!response.ok || !data.verified) {
        const message = 'error' in data ? data.error : 'Payment verification failed.';
        throw new Error(message);
      }

      return data;
    },
    [csrfToken]
  );

  const openRazorpayCheckout = useCallback(
    async (checkoutResponse: CheckoutOnlineSuccessResponse): Promise<PaymentVerificationSuccessResponse> => {
      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error('Razorpay SDK unavailable.');
      }

      return await new Promise((resolve, reject) => {
        let settled = false;
        const settleResolve = (value: PaymentVerificationSuccessResponse) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        };
        const settleReject = (reason: Error) => {
          if (!settled) {
            settled = true;
            reject(reason);
          }
        };

        const razorpay = new RazorpayCheckout({
          key: checkoutResponse.paymentGateway.keyId,
          amount: checkoutResponse.paymentGateway.amountPaise,
          currency: checkoutResponse.paymentGateway.currency,
          order_id: checkoutResponse.paymentGateway.razorpayOrderId,
          name: 'Roorq',
          description: `Order ${checkoutResponse.orderNumber}`,
          notes: {
            parent_order_id: checkoutResponse.orderId,
          },
          prefill: {
            name: userProfile?.full_name ?? '',
            email: user?.email ?? '',
            contact: formData.phone.trim(),
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              if (response.razorpay_order_id !== checkoutResponse.paymentGateway.razorpayOrderId) {
                throw new Error('Gateway order mismatch. Please try again.');
              }
              const verification = await verifyGatewayPayment(
                checkoutResponse,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              settleResolve(verification);
            } catch (error) {
              settleReject(error instanceof Error ? error : new Error('Payment verification failed.'));
            }
          },
          modal: {
            ondismiss: () => {
              settleReject(new Error('Payment was cancelled before completion.'));
            },
          },
          theme: { color: '#111111' },
        });

        razorpay.on('payment.failed', (response: unknown) => {
          const failure =
            typeof response === 'object' && response !== null
              ? (response as { error?: { description?: string } })
              : undefined;
          const failureMessage = failure?.error?.description ?? 'Payment failed. Please retry.';
          settleReject(new Error(failureMessage));
        });

        razorpay.open();
      });
    },
    [formData.phone, user?.email, userProfile?.full_name, verifyGatewayPayment]
  );

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
        karmaCreditsToSpend: applyKarmaCredits
          ? clampSpendableCredits(
              karmaCreditsToSpend,
              subtotal,
              Number(userProfile?.karma_balance ?? 0)
            )
          : 0,
        csrf: csrfToken,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | CheckoutCodSuccessResponse
        | CheckoutOnlineSuccessResponse
        | CheckoutErrorResponse;

      if (!response.ok) {
        const message = 'error' in data ? data.error : 'Failed to place order.';
        toast.error(message);
        setSubmitting(false);
        return;
      }

      if (!isCheckoutSuccess(data)) {
        throw new Error('Invalid checkout response');
      }

      if (data.karmaApplied && data.karmaApplied.creditsUsed > 0) {
        toast.success(
          `Applied ${data.karmaApplied.creditsUsed} karma credits (-${formatINR(data.karmaApplied.discountAmount)})`
        );
      }

      if (isOnlineCheckoutSuccess(data)) {
        const sdkLoaded = await loadRazorpaySdk();
        if (!sdkLoaded) {
          throw new Error('Payment gateway failed to load. Please try again.');
        }

        const verification = await openRazorpayCheckout(data);
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));
        if (verification.paymentStatus === 'paid') {
          toast.success('Payment successful and verified.');
          router.push(`/orders/${verification.orderId}?payment=success`);
        } else {
          toast.success('Payment received. Verification is in progress.');
          router.push(`/orders/${verification.orderId}?payment=pending`);
        }
        return;
      }

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      router.push(`/orders/${data.orderId}`);
    } catch (error: unknown) {
      logger.error('Checkout error', error instanceof Error ? error : undefined);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
  const karmaBalance = Number(userProfile?.karma_balance ?? 0);
  const maxSpendableCredits = computeMaxDiscountCredits(subtotal, karmaBalance);
  const clampedKarmaCredits = applyKarmaCredits
    ? clampSpendableCredits(karmaCreditsToSpend, subtotal, karmaBalance)
    : 0;
  const projectedDiscount = creditsToINR(clampedKarmaCredits);
  const finalTotal = Math.max(0, subtotal - projectedDiscount);

  const onlinePaymentsEnabled = true;

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

                <label
                  className={`flex items-start p-4 border-2 transition-all ${
                    !onlinePaymentsEnabled
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
                    onChange={() => onlinePaymentsEnabled && setPaymentMethod('upi')}
                    disabled={!onlinePaymentsEnabled}
                    className="mt-1 mr-4 accent-white"
                  />
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> UPI (Instant Online)
                    </div>
                    <div className={`text-sm mt-1 ${
                      !onlinePaymentsEnabled
                        ? 'text-gray-500'
                        : paymentMethod === 'upi' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {!onlinePaymentsEnabled
                        ? 'Online payment is temporarily unavailable.'
                        : 'Pay now with UPI apps like GPay, PhonePe, or Paytm.'}
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start p-4 border-2 transition-all ${
                    !onlinePaymentsEnabled
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      : paymentMethod === 'card'
                        ? 'border-black bg-black text-white cursor-pointer'
                        : 'border-gray-200 hover:border-black cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => onlinePaymentsEnabled && setPaymentMethod('card')}
                    disabled={!onlinePaymentsEnabled}
                    className="mt-1 mr-4 accent-white"
                  />
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> Card / Netbanking
                    </div>
                    <div className={`text-sm mt-1 ${
                      !onlinePaymentsEnabled
                        ? 'text-gray-500'
                        : paymentMethod === 'card' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {!onlinePaymentsEnabled
                        ? 'Online payment is temporarily unavailable.'
                        : 'Pay instantly via debit card, credit card, or netbanking.'}
                    </div>
                  </div>
                </label>
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
                <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-black"
                      checked={applyKarmaCredits}
                      onChange={(event) => {
                        setApplyKarmaCredits(event.target.checked);
                        if (event.target.checked) {
                          setKarmaCreditsToSpend(Math.min(maxSpendableCredits, karmaBalance));
                        } else {
                          setKarmaCreditsToSpend(0);
                        }
                      }}
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Use karma credits</p>
                      <p className="text-sm text-gray-700">Balance: {karmaBalance} points (10 = ₹1 off, max 20% of order)</p>
                    </div>
                  </label>
                  {applyKarmaCredits && maxSpendableCredits > 0 ? (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={maxSpendableCredits}
                        step={1}
                        value={Math.min(karmaCreditsToSpend, maxSpendableCredits)}
                        onChange={(event) => setKarmaCreditsToSpend(Number(event.target.value))}
                        className="mt-3 w-full accent-black"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                        <span>Points: {clampedKarmaCredits}</span>
                        <span>-{formatINR(projectedDiscount)}</span>
                      </div>
                      {clampedKarmaCredits > 0 ? (
                        <p className="mt-2 text-sm font-medium text-gray-800">
                          You will save {formatINR(projectedDiscount)} with karma credits.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {applyKarmaCredits && maxSpendableCredits <= 0 ? (
                    <p className="mt-2 text-xs text-gray-500">Nothing to redeem (balance or order cap is zero).</p>
                  ) : null}
                </div>

                <div className="flex justify-between text-xl font-black uppercase">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {clampedKarmaCredits > 0 ? (
                  <div className="mt-2 flex justify-between text-sm font-bold uppercase text-emerald-700">
                    <span>Karma discount</span>
                    <span>-{formatINR(projectedDiscount)}</span>
                  </div>
                ) : null}
                <div className="mt-2 flex justify-between text-xl font-black uppercase">
                  <span>Total</span>
                  <span>{formatINR(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !csrfToken}
                className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {paymentMethod === 'cod' ? 'Placing Order...' : 'Opening Secure Checkout...'}
                  </>
                ) : (
                  paymentMethod === 'cod' ? 'Place COD Order' : 'Pay Securely'
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
