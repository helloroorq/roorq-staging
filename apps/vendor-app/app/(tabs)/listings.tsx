import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ViewStyle, TextStyle, ImageStyle,
  RefreshControl, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/theme'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  category: string
  size: string
  price: number
  vendor_price: number
  images: string[]
  stock_quantity: number
  is_active: boolean
  created_at: string
}

function statusLabel(p: Product): { text: string; color: string } {
  if (p.stock_quantity === 0) return { text: 'Sold', color: Colors.GREEN }
  if (!p.is_active)           return { text: 'Inactive', color: Colors.MUTED }
  return { text: 'Live', color: '#1D9E75' }
}

export default function ListingsScreen() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { load() }, [])

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, size, price, vendor_price, images, stock_quantity, is_active, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data ?? [])
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  async function toggleActive(product: Product) {
    const next = !product.is_active
    // optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: next } : p))
    const { error } = await supabase
      .from('products')
      .update({ is_active: next })
      .eq('id', product.id)
    if (error) {
      // revert on fail
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !next } : p))
      Alert.alert('Error', error.message)
    }
  }

  function confirmDelete(product: Product) {
    Alert.alert(
      'Delete listing',
      `Remove "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setProducts(prev => prev.filter(p => p.id !== product.id))
            await supabase.from('products').delete().eq('id', product.id)
          },
        },
      ]
    )
  }

  function renderItem({ item }: { item: Product }) {
    const thumb = item.images?.[0]
    const status = statusLabel(item)
    return (
      <View style={vs.card}>
        {/* Thumbnail */}
        {thumb ? (
          <Image source={{ uri: thumb }} style={is.thumb} />
        ) : (
          <View style={[vs.thumbPlaceholder]}>
            <Text style={ts.thumbPlaceholderText}>No photo</Text>
          </View>
        )}

        {/* Info */}
        <View style={vs.info}>
          <Text style={ts.name} numberOfLines={1}>{item.name}</Text>
          <Text style={ts.meta}>{item.category} Â· {item.size}</Text>
          <View style={vs.priceRow}>
            <Text style={ts.price}>â‚¹{Math.floor(item.vendor_price ?? item.price).toLocaleString('en-IN')}</Text>
            <View style={[vs.statusBadge, { borderColor: status.color }]}>
              <Text style={[ts.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={vs.actions}>
          <TouchableOpacity
            style={vs.actionBtn}
            onPress={() => toggleActive(item)}
            disabled={item.stock_quantity === 0}
          >
            <Text style={ts.actionIcon}>{item.is_active ? 'ðŸ‘ï¸' : 'ðŸ™ˆ'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={vs.actionBtn} onPress={() => confirmDelete(item)}>
            <Text style={ts.actionIcon}>ðŸ—‘ï¸</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={vs.center}>
        <Text style={ts.muted}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={vs.screen}>
      {/* Header */}
      <View style={vs.header}>
        <Text style={ts.title}>My Listings</Text>
        <TouchableOpacity style={vs.addBtn} onPress={() => router.push('/list-item')}>
          <Text style={ts.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={products.length === 0 ? vs.emptyContainer : vs.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.RED}
            colors={[Colors.RED]}
          />
        }
        ListEmptyComponent={
          <View style={vs.empty}>
            <Text style={ts.emptyIcon}>ðŸ‘•</Text>
            <Text style={ts.emptyTitle}>No listings yet</Text>
            <Text style={ts.emptySub}>Tap the Add button to list your first item</Text>
            <TouchableOpacity style={vs.emptyBtn} onPress={() => router.push('/list-item')}>
              <Text style={ts.emptyBtnText}>List an item â†’</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const vs = StyleSheet.create<Record<string, ViewStyle>>({
  screen:             { flex: 1, backgroundColor: Colors.CREAM },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.CREAM },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.MD, paddingTop: 60, paddingBottom: Spacing.SM, backgroundColor: Colors.CREAM },
  addBtn:             { backgroundColor: Colors.RED, paddingHorizontal: Spacing.MD, paddingVertical: Spacing.XS, borderRadius: 20 },
  listContent:        { paddingHorizontal: Spacing.MD, paddingBottom: 32, gap: Spacing.XS },
  emptyContainer:     { flex: 1 },
  card:               { flexDirection: 'row', backgroundColor: Colors.WHITE, borderRadius: Radius.CARD, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  thumbPlaceholder:   { width: 90, height: 90, backgroundColor: Colors.BORDER, justifyContent: 'center', alignItems: 'center' },
  info:               { flex: 1, padding: Spacing.SM, justifyContent: 'center' },
  priceRow:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.XS, marginTop: 4 },
  statusBadge:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  actions:            { justifyContent: 'center', gap: 4, paddingRight: Spacing.SM },
  actionBtn:          { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  empty:              { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyBtn:           { marginTop: Spacing.MD, backgroundColor: Colors.RED, paddingHorizontal: Spacing.LG, paddingVertical: Spacing.SM, borderRadius: Radius.CARD },
})

const ts = StyleSheet.create<Record<string, TextStyle>>({
  title:                { fontSize: FontSize.XL, fontWeight: FontWeight.BOLD, color: Colors.BLACK },
  addBtnText:           { fontSize: FontSize.SM, fontWeight: FontWeight.BOLD, color: Colors.WHITE },
  name:                 { fontSize: FontSize.BASE, fontWeight: FontWeight.SEMIBOLD, color: Colors.BLACK },
  meta:                 { fontSize: FontSize.XS, color: Colors.MUTED, marginTop: 2 },
  price:                { fontSize: FontSize.MD, fontWeight: FontWeight.BOLD, color: Colors.BLACK },
  statusText:           { fontSize: 10, fontWeight: FontWeight.BOLD },
  actionIcon:           { fontSize: 18 },
  muted:                { color: Colors.MUTED, fontSize: FontSize.SM },
  thumbPlaceholderText: { fontSize: FontSize.XS, color: Colors.MUTED },
  emptyIcon:            { fontSize: 48, marginBottom: Spacing.SM },
  emptyTitle:           { fontSize: FontSize.LG, fontWeight: FontWeight.BOLD, color: Colors.BLACK },
  emptySub:             { fontSize: FontSize.SM, color: Colors.MUTED, marginTop: 4 },
  emptyBtnText:         { fontSize: FontSize.BASE, fontWeight: FontWeight.BOLD, color: Colors.WHITE },
})

const is = StyleSheet.create<Record<string, ImageStyle>>({
  thumb: { width: 90, height: 90 },
})
