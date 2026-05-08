// @ts-nocheck
import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.roorq.com'

export type OrderItem = {
  name: string
  quantity: number
  price: number
}

export type OrderConfirmationEmailProps = {
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  deliveryHostel: string
  deliveryRoom: string
}

const formatINR = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

export default function OrderConfirmationEmail({
  orderNumber,
  items,
  totalAmount,
  deliveryHostel,
  deliveryRoom,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Roorq order {orderNumber} is confirmed</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${SITE_URL}/roorq-logo.png`}
              alt="Roorq"
              width="140"
              height="42"
              style={styles.brandLogo}
            />
            <Text style={styles.headerTag}>ORDER CONFIRMED</Text>
          </Section>

          <Section style={styles.hero}>
            <Heading style={styles.heroTitle}>Your drop is locked.</Heading>
            <Text style={styles.heroSubtitle}>
              Order <strong>{orderNumber}</strong> is confirmed and queued for delivery.
            </Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.sectionTitle}>Items</Text>
            <Section style={styles.items}>
              {items.map((item, index) => (
                <Section key={`${item.name}-${index}`} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    Qty: {item.quantity} â€¢ {formatINR(item.price)}
                  </Text>
                </Section>
              ))}
            </Section>

            <Hr style={styles.divider} />

            <Section style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatINR(totalAmount)}</Text>
            </Section>
          </Section>

          <Section style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>{deliveryHostel}</Text>
            <Text style={styles.addressText}>{deliveryRoom}</Text>
          </Section>

          <Section style={styles.codBlock}>
            <Text style={styles.codTitle}>Pay on Delivery</Text>
            <Text style={styles.codText}>
              Please keep cash or UPI ready. Our rider will collect payment at your hostel.
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Need help? Reply to this email and our team will assist you.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f4f4f4',
    fontFamily: 'Arial, Helvetica, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '24px auto',
    maxWidth: '640px',
    padding: '0 0 32px',
    border: '2px solid #000000',
  },
  header: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  brandLogo: {
    display: 'block',
    height: '32px',
    width: 'auto',
    filter: 'invert(1)',
  },
  headerTag: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '2px',
    margin: 0,
  },
  hero: {
    padding: '28px 32px 0',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '900',
    textTransform: 'uppercase',
    margin: '0 0 8px',
  },
  heroSubtitle: {
    fontSize: '14px',
    margin: 0,
    color: '#1a1a1a',
  },
  content: {
    padding: '24px 32px 0',
  },
  sectionTitle: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontWeight: '700',
    color: '#111111',
    margin: '0 0 12px',
  },
  items: {
    border: '1px solid #000000',
    padding: '16px',
  },
  itemRow: {
    padding: '8px 0',
    borderBottom: '1px solid #e5e5e5',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '700',
    margin: 0,
  },
  itemMeta: {
    fontSize: '12px',
    color: '#555555',
    margin: '4px 0 0',
  },
  divider: {
    borderColor: '#000000',
    margin: '24px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '700',
    textTransform: 'uppercase',
    margin: 0,
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: '900',
    margin: 0,
  },
  addressBlock: {
    padding: '24px 32px 0',
  },
  addressText: {
    fontSize: '13px',
    margin: '2px 0',
  },
  codBlock: {
    margin: '24px 32px 0',
    padding: '16px',
    border: '2px solid #d72638',
    backgroundColor: '#fff5f6',
  },
  codTitle: {
    fontSize: '14px',
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#d72638',
    margin: '0 0 6px',
  },
  codText: {
    fontSize: '12px',
    margin: 0,
    color: '#1a1a1a',
  },
  footer: {
    padding: '24px 32px 0',
  },
  footerText: {
    fontSize: '12px',
    color: '#666666',
    margin: 0,
  },
} as const
