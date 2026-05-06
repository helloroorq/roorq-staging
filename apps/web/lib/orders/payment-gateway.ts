import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { serverEnv } from '@/lib/env.server'

type RazorpayConfig = {
  keyId: string
  keySecret: string
  webhookSecret?: string
}

type CreateRazorpayOrderInput = {
  amountPaise: number
  receipt: string
  notes?: Record<string, string>
}

type RazorpayOrderResult = {
  id: string
  amount: number
  currency: string
  receipt: string
}

type RazorpayPaymentResult = {
  id: string
  orderId: string
  amount: number
  currency: string
  status: string
  method?: string
}

let razorpayClient: Razorpay | null = null

const safeEqualSignature = (expected: string, received: string): boolean => {
  if (expected.length !== received.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'))
}

const getRazorpayConfig = (): RazorpayConfig | null => {
  const keyId = serverEnv.RAZORPAY_KEY_ID
  const keySecret = serverEnv.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return null
  }

  return {
    keyId,
    keySecret,
    webhookSecret: serverEnv.RAZORPAY_WEBHOOK_SECRET,
  }
}

export const isRazorpayConfigured = (): boolean => getRazorpayConfig() !== null

const getRazorpayClient = (): Razorpay => {
  const config = getRazorpayConfig()
  if (!config) {
    throw new Error('Razorpay is not configured on the server.')
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    })
  }

  return razorpayClient
}

export const getRazorpayPublicKey = (): string => {
  const config = getRazorpayConfig()
  if (!config) {
    throw new Error('Razorpay is not configured on the server.')
  }
  return config.keyId
}

export const createRazorpayOrder = async (
  input: CreateRazorpayOrderInput
): Promise<RazorpayOrderResult> => {
  const client = getRazorpayClient()
  const order = await client.orders.create({
    amount: input.amountPaise,
    currency: 'INR',
    receipt: input.receipt,
    notes: input.notes,
  })

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: String(order.currency ?? 'INR'),
    receipt: String(order.receipt ?? input.receipt),
  }
}

export const fetchRazorpayPayment = async (paymentId: string): Promise<RazorpayPaymentResult> => {
  const client = getRazorpayClient()
  const payment = await client.payments.fetch(paymentId)

  return {
    id: payment.id,
    orderId: String(payment.order_id),
    amount: Number(payment.amount),
    currency: String(payment.currency ?? 'INR'),
    status: String(payment.status),
    method: payment.method ? String(payment.method) : undefined,
  }
}

export const verifyRazorpayPaymentSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const config = getRazorpayConfig()
  if (!config) {
    return false
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', config.keySecret)
    .update(body)
    .digest('hex')

  return safeEqualSignature(expectedSignature, razorpaySignature)
}

export const verifyRazorpayWebhookSignature = (payload: string, signature: string): boolean => {
  const config = getRazorpayConfig()
  if (!config?.webhookSecret) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payload)
    .digest('hex')

  return safeEqualSignature(expectedSignature, signature)
}
