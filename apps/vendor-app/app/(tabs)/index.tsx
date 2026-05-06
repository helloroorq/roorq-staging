import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Size, FontSize, FontWeight } from '@/theme'
import { supabase } from '@/lib/supabase'

type ProductLite = {
  id: string
  name: string
  vendor_price: number
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type DashboardData = {
  listed: number
  sold: number
  live: number
  draftOrPaused: number
  earnedMonth: number
  pendingPayout: number
  avgTicket: number
  sellThrough: number
  recentOrders: ProductLite[]
}

const EMPTY: DashboardData = {
  listed: 0,
  sold: 0,
  live: 0,
  draftOrPaused: 0,
  earnedMonth: 0,
  pendingPayout: 0,
  avgTicket: 0,
  sellThrough: 0,
  recentOrders: [],
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatMoney(value: number) {
  return value.toLocaleString('en-IN')
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function DashboardScreen() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data: products } = await supabase
        .from('products')
        .select('id, name, vendor_price, stock_quantity, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })

      const all = (products ?? []) as ProductLite[]
      const listed = all.length
      const soldItems = all.filter((p) => p.stock_quantity === 0)
      const sold = soldItems.length
      const live = all.filter((p) => p.is_active && p.stock_quantity > 0).length
      const draftOrPaused = all.filter((p) => !p.is_active && p.stock_quantity > 0).length
      const soldThisMonth = soldItems.filter((p) => p.updated_at >= monthStart)
      const earnedMonth = soldThisMonth.reduce((sum, p) => sum + (Number(p.vendor_price) || 0), 0)
      const pendingPayout = Math.floor(earnedMonth * 0.25)
      const avgTicket = sold ? Math.floor(soldItems.reduce((sum, p) => sum + (Number(p.vendor_price) || 0), 0) / sold) : 0
      const sellThrough = listed ? Math.round((sold / listed) * 100) : 0
      const recentOrders = soldItems.slice(0, 4)

      setData({
        listed,
        sold,
        live,
        draftOrPaused,
        earnedMonth: Math.floor(earnedMonth),
        pendingPayout,
        avgTicket,
        sellThrough,
        recentOrders,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const weeklyBars = [
    Math.min(Math.max(data.live, 1), 7),
    Math.min(Math.max(data.sold, 1), 7),
    Math.min(Math.max(data.sellThrough / 15, 1), 7),
    Math.min(Math.max(data.avgTicket / 300, 1), 7),
  ]

  return (
    <ScrollView
      style={vs.screen}
      contentContainerStyle={vs.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.RED} colors={[Colors.RED]} />
      }
    >
      <View style={vs.header}>
        <Text style={ts.greeting}>{greeting()}, seller</Text>
        <Text style={ts.sub}>Track listings, orders, and payouts in one place.</Text>
      </View>

      <View style={vs.hero}>
        <Text style={ts.heroLabel}>This month earnings</Text>
        <Text style={ts.heroAmount}>{loading ? '--' : `Rs ${formatMoney(data.earnedMonth)}`}</Text>
        <Text style={ts.heroSub}>
          {data.sold > 0 ? `${data.sold} orders completed` : 'No completed orders yet. Publish your first listing.'}
        </Text>
      </View>

      <View style={vs.quickActionWrap}>
        <TouchableOpacity style={vs.quickActionBtn} onPress={() => router.push('/list-item')}>
          <Text style={ts.quickActionIcon}>+</Text>
          <Text style={ts.quickActionText}>Create listing</Text>
        </TouchableOpacity>
      </View>

      <View style={vs.statsRow}>
        {[
          { label: 'Live', value: data.live },
          { label: 'Orders', value: data.sold },
          { label: 'Payout due', value: `Rs ${formatMoney(data.pendingPayout)}` },
        ].map((item) => (
          <View style={vs.statCard} key={item.label}>
            <Text style={ts.statValue}>{loading ? '--' : item.value}</Text>
            <Text style={ts.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={vs.sectionCard}>
        <Text style={ts.sectionTitle}>Listings</Text>
        <View style={vs.row}>
          <Text style={ts.rowLabel}>Total listings</Text>
          <Text style={ts.rowValue}>{loading ? '--' : data.listed}</Text>
        </View>
        <View style={vs.row}>
          <Text style={ts.rowLabel}>Draft or paused</Text>
          <Text style={ts.rowValue}>{loading ? '--' : data.draftOrPaused}</Text>
        </View>
        <TouchableOpacity style={vs.linkBtn} onPress={() => router.push('/(tabs)/listings')}>
          <Text style={ts.linkBtnText}>Manage listings</Text>
        </TouchableOpacity>
      </View>

      <View style={vs.sectionCard}>
        <Text style={ts.sectionTitle}>Orders</Text>
        {data.recentOrders.length === 0 ? (
          <Text style={ts.muted}>No recent orders yet.</Text>
        ) : (
          data.recentOrders.map((order) => (
            <View style={vs.orderRow} key={order.id}>
              <View style={{ flex: 1 }}>
                <Text style={ts.rowValue}>{order.name}</Text>
                <Text style={ts.smallMuted}>Sold {timeAgo(order.updated_at)}</Text>
              </View>
              <Text style={ts.rowValue}>Rs {formatMoney(Math.floor(Number(order.vendor_price) || 0))}</Text>
            </View>
          ))
        )}
      </View>

      <View style={vs.sectionCard}>
        <Text style={ts.sectionTitle}>Payouts</Text>
        <View style={vs.row}>
          <Text style={ts.rowLabel}>Pending payout</Text>
          <Text style={ts.rowValue}>Rs {loading ? '--' : formatMoney(data.pendingPayout)}</Text>
        </View>
        <View style={vs.row}>
          <Text style={ts.rowLabel}>Status</Text>
          <Text style={ts.rowValue}>{data.pendingPayout > 0 ? 'Processing' : 'No payout due'}</Text>
        </View>
      </View>

      <View style={vs.sectionCard}>
        <Text style={ts.sectionTitle}>Basic analytics</Text>
        <View style={vs.row}>
          <Text style={ts.rowLabel}>Sell-through</Text>
          <Text style={ts.rowValue}>{loading ? '--' : `${data.sellThrough}%`}</Text>
        </View>
        <View style={vs.row}>
          <Text style={ts.rowLabel}>Average order value</Text>
          <Text style={ts.rowValue}>Rs {loading ? '--' : formatMoney(data.avgTicket)}</Text>
        </View>
        <View style={vs.chartRow}>
          {weeklyBars.map((bar, idx) => (
            <View key={idx} style={[vs.chartBar, { height: 14 + bar * 8 }]} />
          ))}
        </View>
      </View>

      <View style={vs.whatsappCard}>
        <Text style={ts.sectionTitle}>WhatsApp automation</Text>
        <Text style={ts.muted}>
          Configure EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL to auto-send listing and order updates.
        </Text>
      </View>
    </ScrollView>
  )
}

const vs = StyleSheet.create<Record<string, ViewStyle>>({
  screen: { flex: 1, backgroundColor: Colors.CREAM },
  content: { paddingHorizontal: Spacing.MD, paddingTop: 60, paddingBottom: 40, gap: Spacing.SM },
  header: { marginBottom: Spacing.XS },
  hero: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radius.SHEET,
    padding: Spacing.MD,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  quickActionWrap: { alignItems: 'center', marginVertical: Spacing.XS },
  quickActionBtn: {
    width: Size.CAMERA_BUTTON + 26,
    height: Size.CAMERA_BUTTON + 26,
    borderRadius: (Size.CAMERA_BUTTON + 26) / 2,
    backgroundColor: Colors.RED,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.RED,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.XS },
  statCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: Radius.CARD,
    padding: Spacing.SM,
    alignItems: 'center',
  },
  sectionCard: { backgroundColor: Colors.WHITE, borderRadius: Radius.CARD, padding: Spacing.SM, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: Radius.INPUT,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    paddingHorizontal: Spacing.SM,
    paddingVertical: 10,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  chartBar: { flex: 1, borderRadius: 8, backgroundColor: Colors.RED },
  whatsappCard: {
    backgroundColor: '#FFF8F7',
    borderRadius: Radius.CARD,
    padding: Spacing.SM,
    borderWidth: 1,
    borderColor: '#F0D6D3',
  },
})

const ts = StyleSheet.create<Record<string, TextStyle>>({
  greeting: { fontSize: FontSize.XL, color: Colors.BLACK, fontWeight: FontWeight.BOLD },
  sub: { marginTop: 2, fontSize: FontSize.SM, color: Colors.MUTED },
  heroLabel: { fontSize: FontSize.SM, color: Colors.MUTED },
  heroAmount: { marginTop: 4, fontSize: FontSize.XXL, color: Colors.BLACK, fontWeight: FontWeight.BOLD },
  heroSub: { marginTop: 8, fontSize: FontSize.SM, color: Colors.MUTED },
  quickActionIcon: { fontSize: 38, color: Colors.WHITE, fontWeight: FontWeight.BOLD, lineHeight: 38 },
  quickActionText: { fontSize: FontSize.XS, marginTop: 2, color: Colors.WHITE, fontWeight: FontWeight.SEMIBOLD },
  statValue: { fontSize: FontSize.MD, color: Colors.BLACK, fontWeight: FontWeight.BOLD, textAlign: 'center' },
  statLabel: { fontSize: FontSize.XS, color: Colors.MUTED, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.SM, color: Colors.BLACK, fontWeight: FontWeight.BOLD },
  rowLabel: { fontSize: FontSize.SM, color: Colors.MUTED },
  rowValue: { fontSize: FontSize.SM, color: Colors.BLACK, fontWeight: FontWeight.SEMIBOLD },
  muted: { fontSize: FontSize.SM, color: Colors.MUTED },
  smallMuted: { fontSize: FontSize.XS, color: Colors.MUTED, marginTop: 2 },
  linkBtnText: { fontSize: FontSize.SM, color: Colors.BLACK, fontWeight: FontWeight.SEMIBOLD },
})
