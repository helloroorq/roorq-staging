import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ViewStyle, TextStyle, Alert, Share,
} from 'react-native'
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/theme'
import { supabase } from '@/lib/supabase'

type Stats = { listed: number; sold: number }

// DEV mock — replaced by real session when auth is wired
const DEV_VENDOR = { name: 'Harish Nenavath', email: 'harish@roorq.com', store: 'Harish\'s Store' }

export default function ProfileScreen() {
  const [stats, setStats] = useState<Stats>({ listed: 0, sold: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      // Total listed
      const { count: listed } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Total sold (stock_quantity = 0 means sold out)
      const { count: sold } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('stock_quantity', 0)

      setStats({ listed: listed ?? 0, sold: sold ?? 0 })
    } catch (e) {
      // silently fail — stats just show 0
    } finally {
      setLoading(false)
    }
  }

  async function shareStore() {
    try {
      await Share.share({
        message: `Check out ${DEV_VENDOR.store} on Roorq 🛍️\nhttps://roorq.com`,
        title: 'Share your store',
      })
    } catch (e) {}
  }

  function signOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          // Router redirect will be handled once auth is wired
        },
      },
    ])
  }

  // Avatar initials from name
  const initials = DEV_VENDOR.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <ScrollView style={vs.screen} contentContainerStyle={vs.content} showsVerticalScrollIndicator={false}>

      {/* Avatar + name */}
      <View style={vs.avatarSection}>
        <View style={vs.avatar}>
          <Text style={ts.initials}>{initials}</Text>
        </View>
        <Text style={ts.name}>{DEV_VENDOR.name}</Text>
        <Text style={ts.email}>{DEV_VENDOR.email}</Text>
      </View>

      {/* Stats */}
      <View style={vs.statsRow}>
        <View style={vs.statCard}>
          <Text style={ts.statValue}>{loading ? '—' : stats.listed}</Text>
          <Text style={ts.statLabel}>Listed</Text>
        </View>
        <View style={vs.statDivider} />
        <View style={vs.statCard}>
          <Text style={ts.statValue}>{loading ? '—' : stats.sold}</Text>
          <Text style={ts.statLabel}>Sold</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={vs.section}>
        <Text style={ts.sectionTitle}>Store</Text>

        <TouchableOpacity style={vs.row} onPress={shareStore} activeOpacity={0.7}>
          <View style={vs.rowLeft}>
            <Text style={ts.rowIcon}>🔗</Text>
            <Text style={ts.rowLabel}>Share your store link</Text>
          </View>
          <Text style={ts.rowArrow}>›</Text>
        </TouchableOpacity>

        <View style={vs.rowBorder} />

        <TouchableOpacity style={vs.row} activeOpacity={0.7}
          onPress={() => Alert.alert('Coming soon', 'Store customisation coming in the next update.')}>
          <View style={vs.rowLeft}>
            <Text style={ts.rowIcon}>✏️</Text>
            <Text style={ts.rowLabel}>Edit store name</Text>
          </View>
          <Text style={ts.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={vs.section}>
        <Text style={ts.sectionTitle}>Account</Text>

        <TouchableOpacity style={vs.row} activeOpacity={0.7}
          onPress={() => Alert.alert('Coming soon', 'Payout settings coming soon.')}>
          <View style={vs.rowLeft}>
            <Text style={ts.rowIcon}>💰</Text>
            <Text style={ts.rowLabel}>Payout settings</Text>
          </View>
          <Text style={ts.rowArrow}>›</Text>
        </TouchableOpacity>

        <View style={vs.rowBorder} />

        <TouchableOpacity style={vs.row} activeOpacity={0.7}
          onPress={() => Alert.alert('Need help?', 'WhatsApp us at +91 63050 35519 or email harish@roorq.com')}>
          <View style={vs.rowLeft}>
            <Text style={ts.rowIcon}>💬</Text>
            <Text style={ts.rowLabel}>Help & support</Text>
          </View>
          <Text style={ts.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={vs.signOutBtn} onPress={signOut} activeOpacity={0.8}>
        <Text style={ts.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={ts.version}>Roorq Vendor · v1.0.0</Text>

    </ScrollView>
  )
}

const vs = StyleSheet.create<Record<string, ViewStyle>>({
  screen:       { flex: 1, backgroundColor: Colors.CREAM },
  content:      { paddingHorizontal: Spacing.MD, paddingTop: 60, paddingBottom: 48 },
  avatarSection:{ alignItems: 'center', marginBottom: Spacing.LG },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.RED, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.SM },
  statsRow:     { flexDirection: 'row', backgroundColor: Colors.WHITE, borderRadius: Radius.CARD, marginBottom: Spacing.LG, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statCard:     { flex: 1, alignItems: 'center', paddingVertical: Spacing.MD },
  statDivider:  { width: 1, backgroundColor: Colors.BORDER, marginVertical: Spacing.SM },
  section:      { backgroundColor: Colors.WHITE, borderRadius: Radius.CARD, marginBottom: Spacing.MD, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.MD, paddingVertical: 16 },
  rowLeft:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.SM },
  rowBorder:    { height: 1, backgroundColor: Colors.BORDER, marginLeft: Spacing.MD + 28 + Spacing.SM },
  signOutBtn:   { height: 52, backgroundColor: Colors.WHITE, borderRadius: Radius.CARD, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8C0C0', marginTop: Spacing.SM },
})

const ts = StyleSheet.create<Record<string, TextStyle>>({
  initials:    { fontSize: 28, fontWeight: FontWeight.BOLD, color: Colors.WHITE },
  name:        { fontSize: FontSize.LG, fontWeight: FontWeight.BOLD, color: Colors.BLACK },
  email:       { fontSize: FontSize.SM, color: Colors.MUTED, marginTop: 2 },
  statValue:   { fontSize: FontSize.XL, fontWeight: FontWeight.BOLD, color: Colors.BLACK },
  statLabel:   { fontSize: FontSize.XS, color: Colors.MUTED, marginTop: 2 },
  sectionTitle:{ fontSize: FontSize.XS, fontWeight: FontWeight.BOLD, color: Colors.MUTED, paddingHorizontal: Spacing.MD, paddingTop: Spacing.SM, paddingBottom: 4, letterSpacing: 0.8 },
  rowIcon:     { fontSize: 18, width: 28, textAlign: 'center' },
  rowLabel:    { fontSize: FontSize.BASE, color: Colors.BLACK },
  rowArrow:    { fontSize: 22, color: Colors.MUTED },
  signOutText: { fontSize: FontSize.BASE, fontWeight: FontWeight.SEMIBOLD, color: Colors.RED },
  version:     { fontSize: FontSize.XS, color: Colors.MUTED, textAlign: 'center', marginTop: Spacing.LG },
})
