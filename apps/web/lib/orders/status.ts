export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Packed' },
  { value: 'out_for_delivery', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'payment_collected', label: 'Payment Collected' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value']

export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((item) => item.value) as [
  OrderStatus,
  ...OrderStatus[],
]

export const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  placed: 'pending',
  reserved: 'pending',
  packed: 'confirmed',
}

export const normalizeOrderStatus = (status: string): OrderStatus => {
  if (status in LEGACY_STATUS_MAP) {
    return LEGACY_STATUS_MAP[status]
  }

  const known = ORDER_STATUSES.find((item) => item.value === status)
  return known ? known.value : 'pending'
}

export const getOrderStatusLabel = (status: string) => {
  const normalized = normalizeOrderStatus(status)
  return ORDER_STATUSES.find((item) => item.value === normalized)?.label ?? status
}

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['payment_collected'],
  payment_collected: [],
  cancelled: [],
}

export const PAYMENT_STATUSES = ['pending', 'collected', 'failed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
