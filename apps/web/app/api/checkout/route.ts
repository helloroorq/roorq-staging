import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getResendClient } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/observability/request';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { optionalServerEnv } from '@/lib/env.server';
import {
  createRazorpayOrder,
  getRazorpayPublicKey,
  isRazorpayConfigured,
} from '@/lib/orders/payment-gateway';

export const runtime = 'nodejs';

const PhoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine(
    (value) => value.length === 10 || (value.length === 12 && value.startsWith('91')),
    'Invalid phone number'
  )
  .transform((value) => (value.length === 10 ? `+91${value}` : `+${value}`));

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const CheckoutRequestSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  deliveryHostel: z.string().trim().min(2).max(100),
  deliveryRoom: z.string().trim().min(1).max(30),
  phone: PhoneSchema,
  paymentMethod: z.enum(['cod', 'upi', 'card']).default('cod'),
  karmaCreditsToSpend: z.number().int().min(0).max(500).default(0),
  csrf: z.string().min(16),
});

const CheckoutResultSchema = z.object({
  parent_order_id: z.string().uuid(),
  order_number: z.string(),
  total_amount: z.preprocess(
    (value) => (typeof value === 'string' ? Number(value) : value),
    z.number()
  ),
});

type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
type CheckoutSuccessResponse = {
  mode: 'cod';
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  karmaApplied: {
    creditsUsed: number;
    discountAmount: number;
  };
};
type CheckoutOnlineSuccessResponse = {
  mode: 'online';
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  karmaApplied: {
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

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, RateLimitEntry>();

const toAmountPaise = (amount: number): number => Math.round(amount * 100);

const getClientIp = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const checkRateLimit = (key: string): { allowed: boolean; retryAfter: number | null } => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: null };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  rateLimitMap.set(key, entry);
  return { allowed: true, retryAfter: null };
};

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const jsonResponse = (
    body: Record<string, unknown>,
    status: number,
    headers?: Record<string, string>
  ) => {
    const response = NextResponse.json(body, { status, headers });
    response.headers.set('x-request-id', requestId);
    return response;
  };

  const rateKey = `checkout:${getClientIp(request)}`;
  const rateResult = checkRateLimit(rateKey);
  if (!rateResult.allowed) {
    return jsonResponse(
      { error: 'Too many checkout attempts. Please try again shortly.' },
      429,
      rateResult.retryAfter ? { 'Retry-After': rateResult.retryAfter.toString() } : undefined
    );
  }

  let payload: CheckoutRequest;
  try {
    const body = await request.json();
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(
        {
          error: 'Invalid checkout request.',
          details: parsed.error.issues.map((issue) => issue.message),
        },
        400
      );
    }
    payload = parsed.data;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: 'Unauthorized. Please sign in.' }, 401);
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf);
  if (!csrfCheck.ok) {
    return jsonResponse({ error: csrfCheck.error }, 403);
  }

  const shippingAddress = {
    hostel: payload.deliveryHostel,
    room: payload.deliveryRoom,
    phone: payload.phone,
    campus: 'IIT Roorkee',
  };

  const { data, error } = await supabase.rpc('create_marketplace_order', {
    p_items: payload.items,
    p_shipping_address: shippingAddress,
    p_billing_address: null,
    p_payment_method: payload.paymentMethod,
  });

  if (error) {
    const isClientError = error.code === 'P0001';
    logger.error('Checkout RPC failed', { error: error.message, requestId });
    return jsonResponse({ error: error.message || 'Checkout failed.' }, isClientError ? 400 : 500);
  }

  const parsedResult = CheckoutResultSchema.safeParse(data);
  if (!parsedResult.success) {
    logger.error('Checkout response validation failed', { requestId });
    return jsonResponse({ error: 'Unexpected checkout response. Please try again.' }, 500);
  }

  const responseBase: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    karmaApplied: {
      creditsUsed: number;
      discountAmount: number;
    };
  } = {
    orderId: parsedResult.data.parent_order_id,
    orderNumber: parsedResult.data.order_number,
    totalAmount: parsedResult.data.total_amount,
    karmaApplied: {
      creditsUsed: 0,
      discountAmount: 0,
    },
  };

  if (payload.karmaCreditsToSpend > 0) {
    const karmaBase = optionalServerEnv('KARMA_API_URL');
    if (!karmaBase) {
      logger.warn('Karma redeem skipped: KARMA_API_URL not set', { requestId, orderId: responseBase.orderId });
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return jsonResponse({ error: 'Session required to redeem karma.' }, 401);
      }
      const redeemRes = await fetch(`${karmaBase.replace(/\/$/, '')}/api/karma/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId: responseBase.orderId,
          amount: payload.karmaCreditsToSpend,
        }),
      });
      if (!redeemRes.ok) {
        const errText = await redeemRes.text();
        logger.warn('Karma redeem failed', {
          requestId,
          orderId: responseBase.orderId,
          status: redeemRes.status,
          errText,
        });
        return jsonResponse(
          { error: errText || 'Could not apply karma to this order.' },
          redeemRes.status >= 400 && redeemRes.status < 500 ? 400 : 502
        );
      }
      const redeemBody = (await redeemRes.json()) as {
        discountInr?: number;
        newTotal?: number;
      };
      responseBase.karmaApplied = {
        creditsUsed: payload.karmaCreditsToSpend,
        discountAmount: Number(redeemBody.discountInr ?? 0),
      };
      if (Number.isFinite(redeemBody.newTotal) && redeemBody.newTotal !== undefined) {
        responseBase.totalAmount = redeemBody.newTotal;
      }
    }
  }

  if (payload.paymentMethod !== 'cod') {
    if (!isRazorpayConfigured()) {
      logger.error('Razorpay environment variables are missing for online checkout', { requestId });
      return jsonResponse(
        { error: 'Online payments are temporarily unavailable. Please use Cash on Delivery.' },
        503
      );
    }

    const amountPaise = toAmountPaise(responseBase.totalAmount);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      logger.error('Invalid online payment amount generated', {
        requestId,
        orderId: responseBase.orderId,
        totalAmount: responseBase.totalAmount,
      });
      return jsonResponse({ error: 'Invalid payment amount generated.' }, 500);
    }

    try {
      const razorpayOrder = await createRazorpayOrder({
        amountPaise,
        receipt: responseBase.orderNumber.slice(0, 40),
        notes: {
          parentOrderId: responseBase.orderId,
          orderNumber: responseBase.orderNumber,
        },
      });

      const adminClient = getAdminClient();
      if (!adminClient) {
        logger.error('SUPABASE_SERVICE_ROLE_KEY missing; cannot persist payment intent', { requestId });
        return jsonResponse({ error: 'Payment service is unavailable. Please try later.' }, 503);
      }

      const { error: paymentLedgerError } = await adminClient.rpc('apply_parent_order_payment', {
        p_parent_order_id: responseBase.orderId,
        p_provider: 'razorpay',
        p_provider_order_id: razorpayOrder.id,
        p_provider_payment_id: null,
        p_amount: responseBase.totalAmount,
        p_currency: razorpayOrder.currency,
        p_status: 'created',
        p_raw_payload: {
          source: 'checkout',
          checkoutPaymentMethod: payload.paymentMethod,
          requestId,
        },
      });

      if (paymentLedgerError) {
        logger.error('Failed to persist payment intent', {
          requestId,
          orderId: responseBase.orderId,
          error: paymentLedgerError.message,
        });
        return jsonResponse({ error: 'Could not initialize payment tracking. Please try again.' }, 500);
      }

      const onlineResponse: CheckoutOnlineSuccessResponse = {
        mode: 'online',
        ...responseBase,
        paymentGateway: {
          provider: 'razorpay',
          keyId: getRazorpayPublicKey(),
          razorpayOrderId: razorpayOrder.id,
          amountPaise: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      };

      return jsonResponse(onlineResponse, 200);
    } catch (paymentInitError) {
      logger.error(
        'Failed to initialize Razorpay order',
        paymentInitError instanceof Error
          ? {
              error: paymentInitError.message,
              requestId,
              orderId: responseBase.orderId,
            }
          : { error: paymentInitError, requestId, orderId: responseBase.orderId }
      );
      return jsonResponse(
        { error: 'Unable to start online payment right now. Please choose Cash on Delivery.' },
        502
      );
    }
  }

  const response: CheckoutSuccessResponse = {
    mode: 'cod',
    ...responseBase,
  };

  const resend = getResendClient();
  if (resend && user.email) {
    try {
      const orderNumber = escapeHtml(response.orderNumber);
      const deliveryHostel = escapeHtml(payload.deliveryHostel);
      const deliveryRoom = escapeHtml(payload.deliveryRoom);
      const totalAmount = response.totalAmount.toFixed(2);
      const paymentCopy = 'Payment: Pay on delivery (Cash or UPI at delivery).';
      const html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f7f7f5; padding: 24px;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e6e4de;">
            <h1 style="margin: 0 0 12px; font-size: 24px; color: #1c1b18;">Order confirmed</h1>
            <p style="margin: 0 0 16px; color: #4f4a43; font-size: 14px;">Thanks for shopping with Roorq. Your order is confirmed and will be processed shortly.</p>
            <div style="padding: 16px; border-radius: 12px; background: #faf8f2; border: 1px solid #efe8d8;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6f675d; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
              <p style="margin: 0; font-size: 20px; font-weight: 600; color: #1c1b18;">${orderNumber}</p>
            </div>
            <div style="margin-top: 16px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6f675d; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1c1b18;">INR ${totalAmount}</p>
            </div>
            <div style="margin-top: 16px; padding: 12px 16px; border-radius: 12px; background: #fff7e6; border: 1px solid #ffe2b8;">
              <p style="margin: 0; font-size: 14px; color: #8a5b11;">
                ${paymentCopy}
              </p>
            </div>
            <div style="margin-top: 16px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6f675d; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</p>
              <p style="margin: 0; color: #1c1b18;">${deliveryHostel}, Room ${deliveryRoom}</p>
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #efe8d8;">
              <p style="margin: 0; font-size: 12px; color: #6f675d;">If you have any questions, reply to this email.</p>
            </div>
          </div>
        </div>
      `;

      const { error: sendError } = await resend.emails.send({
        from: 'Roorq <onboarding@resend.dev>',
        to: [user.email],
        subject: `Order confirmed: ${response.orderNumber}`,
        html,
      });

      if (sendError) {
        logger.error(
          'Resend error',
          sendError instanceof Error ? sendError : { error: sendError, requestId }
        );
      }
    } catch (emailError) {
      logger.error(
        'Order confirmation email failed',
        emailError instanceof Error ? emailError : { error: emailError, requestId }
      );
    }
  } else if (!resend) {
    logger.warn('RESEND_API_KEY not configured; skipping order confirmation email.');
  }

  return jsonResponse(response, 200);
}
