export type SupportedPaymentMethod = 'cod' | 'upi' | 'card';

export type PaymentIntentResult =
  | { ok: true; provider: string; intentId: string; redirectUrl?: string | null }
  | { ok: false; reason: 'not_configured' | 'unsupported'; message: string };

export interface PaymentProvider {
  createIntent(args: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: 'INR';
    method: Exclude<SupportedPaymentMethod, 'cod'>;
    customerId: string;
  }): Promise<PaymentIntentResult>;
}

class StubPaymentProvider implements PaymentProvider {
  async createIntent(): Promise<PaymentIntentResult> {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Online payments are not configured yet. Please use COD.',
    };
  }
}

const paymentProvider: PaymentProvider = new StubPaymentProvider();

export const getPaymentProvider = (): PaymentProvider => paymentProvider;
