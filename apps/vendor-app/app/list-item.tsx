import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ViewStyle, TextStyle, TextInput,
  Image, ImageStyle, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Size, FontSize, FontWeight } from '@/theme'
import { supabase } from '@/lib/supabase'
import { queueVendorNotification } from '@/lib/vendor-notifications'

// ── Constants from DB CHECK constraints ──────────────────────
const CATEGORIES = ['t-shirt', 'jeans', 'jacket', 'sweater', 'shoes', 'accessories', 'trousers']
const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free']
const GENDERS    = ['men', 'women', 'unisex']
const STEPS      = ['Photos', 'Details', 'Story']
const MIN_PHOTOS = 2
const MAX_PHOTOS = 5

const STORY_QUESTIONS = [
  { key: 'origin', q: '📍 Where did you find this piece?' },
  { key: 'era',    q: '📅 What year or era is it from?' },
  { key: 'brand',  q: '🏷️ What brand is it?' },
  { key: 'why',    q: "✨ One line about why it's special?" },
] as const

type Photo = { uri: string }
type Story = { origin: string; era: string; brand: string; why: string }
type ListingStatus = 'live' | 'paused' | 'draft'
type Details = {
  name: string
  category: string
  size: string
  gender: string
  price: string
  status: ListingStatus
}

// ─────────────────────────────────────────────────────────────
export default function ListItemScreen() {
  const router = useRouter()

  const [step, setStep]       = useState(0)
  const [photos, setPhotos]   = useState<Photo[]>([])
  const [details, setDetails] = useState<Details>({
    name: '',
    category: '',
    size: '',
    gender: 'unisex',
    price: '',
    status: 'live',
  })
  const [story, setStory]     = useState<Story>({ origin: '', era: '', brand: '', why: '' })
  const [loading, setLoading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')  // shows "Uploading photo 1/3..."

  // ── Photo pickers ────────────────────────────────────────
  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo access to list items.')
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_PHOTOS - photos.length,
    })
    if (result.canceled) return
    setPhotos(prev => [...prev, ...result.assets.map(a => ({ uri: a.uri }))].slice(0, MAX_PHOTOS))
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow camera access.')
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (result.canceled) return
    setPhotos(prev => [...prev, { uri: result.assets[0].uri }].slice(0, MAX_PHOTOS))
  }

  // ── Navigation ───────────────────────────────────────────
  function goNext() {
    if (step === 0) {
      if (photos.length < MIN_PHOTOS)
        return Alert.alert('Add more photos', `Please add at least ${MIN_PHOTOS} photos.`)
      setStep(1); return
    }
    if (step === 1) {
      if (!details.name.trim())     return Alert.alert('Add a name', 'e.g. "Vintage Levi\'s 501"')
      if (!details.category)        return Alert.alert('Pick a category')
      if (!details.size)            return Alert.alert('Pick a size')
      if (!details.price || Number(details.price) < 1)
                                    return Alert.alert('Set a price')
      setStep(2); return
    }
    submitListing()
  }

  // ── Upload one photo to Supabase Storage ─────────────────
  // What's happening: fetch the local file → turn into blob → upload to bucket
  async function uploadPhoto(uri: string, index: number): Promise<string> {
    setUploadStep(`Uploading photo ${index + 1} of ${photos.length}...`)

    const ext      = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const fileName = `vendor/${Date.now()}_${index}.${ext}`

    // Read file as base64 — works on both iOS and Android
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    })

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, decode(base64), { contentType: `image/${ext}` })

    if (error) throw new Error(`Photo upload failed: ${error.message}`)

    // Return the public URL so we can store it in the products table
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  // ── Submit: upload photos → insert product row ───────────
  async function submitListing() {
    setLoading(true)
    try {
      // 1. Upload all photos, collect their public URLs
      const imageUrls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const url = await uploadPhoto(photos[i].uri, i)
        imageUrls.push(url)
      }

      // 2. Build story description from the 4 questions
      setUploadStep('Saving your listing...')
      const description = [
        story.origin && `Found: ${story.origin}`,
        story.era    && `Era: ${story.era}`,
        story.brand  && `Brand: ${story.brand}`,
        story.why    && story.why,
      ].filter(Boolean).join(' · ')

      // 3. Get current vendor session (falls back to null in dev)
      const { data: { session } } = await supabase.auth.getSession()

      // 4. Insert product row into Supabase
      const isLive = details.status === 'live'
      const { error, data: inserted } = await supabase
        .from('products')
        .insert({
        name:           details.name.trim(),
        category:       details.category,
        size:           details.size,
        gender:         details.gender,
        price:          Number(details.price),
        vendor_price:   Number(details.price),
        platform_price: Math.ceil(Number(details.price) * 1.15),  // 15% fee
        brand:          story.brand || null,
        description:    description || null,
        images:         imageUrls,
        stock_quantity: 1,
        is_active:      isLive,
        vendor_id:      session?.user?.id ?? null,
      })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      if (isLive) {
        await queueVendorNotification({
          type: 'listing_published',
          payload: {
            listingId: inserted?.id,
            listingName: details.name.trim(),
            listingPrice: Number(details.price),
          },
        })
      }

      setUploadStep('')
      Alert.alert(
        'Listed! 🎉',
        `"${details.name}" is now live on Roorq.\n\nBuyers can see it on the website right now.`,
        [{ text: 'Done', onPress: () => router.back() }]
      )
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message)
    } finally {
      setLoading(false)
      setUploadStep('')
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={vs.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top bar */}
      <View style={vs.topBar}>
        <TouchableOpacity
          onPress={() => step === 0 ? router.back() : setStep(s => s - 1)}
          style={vs.backBtn}
        >
          <Text style={ts.backArrow}>{step === 0 ? '✕' : '←'}</Text>
        </TouchableOpacity>
        <Text style={ts.topTitle}>List an item</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={vs.progressRow}>
        {STEPS.map((label, i) => (
          <View key={label} style={vs.progressItem}>
            <View style={[vs.dot, i <= step && vs.dotActive]}>
              <Text style={[ts.dotNum, i <= step && ts.dotNumActive]}>
                {i < step ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[ts.dotLabel, i === step && ts.dotLabelActive]}>{label}</Text>
            {i < STEPS.length - 1 && <View style={[vs.line, i < step && vs.lineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView
        style={vs.scroll}
        contentContainerStyle={vs.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ STEP 1 — PHOTOS ══ */}
        {step === 0 && (
          <>
            <Text style={ts.stepTitle}>Add photos</Text>
            <Text style={ts.stepSub}>{photos.length}/{MAX_PHOTOS} · minimum {MIN_PHOTOS}</Text>

            <View style={vs.grid}>
              {photos.map((p, i) => (
                <View key={i} style={vs.thumb}>
                  <Image source={{ uri: p.uri }} style={is.thumb} />
                  <TouchableOpacity style={vs.removeBtn} onPress={() => setPhotos(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={ts.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={vs.addSlot} onPress={pickFromGallery}>
                  <Text style={ts.addIcon}>+</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={vs.pickBtn} onPress={pickFromCamera} activeOpacity={0.8}>
              <Text style={ts.pickBtnText}>📷  Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[vs.pickBtn, vs.pickBtnOutline]} onPress={pickFromGallery} activeOpacity={0.8}>
              <Text style={[ts.pickBtnText, { color: Colors.BLACK }]}>🖼️  Choose from gallery</Text>
            </TouchableOpacity>
            <Text style={ts.tip}>💡 Shoot on white background for best results</Text>
          </>
        )}

        {/* ══ STEP 2 — DETAILS + PRICE ══ */}
        {step === 1 && (
          <>
            {/* Item name */}
            <Text style={ts.fieldLabel}>Item name</Text>
            <TextInput
              style={ts.textInput}
              placeholder='e.g. Vintage Levis 501 Jeans'
              placeholderTextColor={Colors.MUTED}
              value={details.name}
              onChangeText={v => setDetails(d => ({ ...d, name: v }))}
              returnKeyType="done"
            />

            {/* Category */}
            <Text style={ts.fieldLabel}>Category</Text>
            <View style={vs.pills}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[vs.pill, details.category === c && vs.pillActive]}
                  onPress={() => setDetails(d => ({ ...d, category: c }))}
                >
                  <Text style={[ts.pillText, details.category === c && ts.pillTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Size */}
            <Text style={ts.fieldLabel}>Size</Text>
            <View style={vs.pills}>
              {SIZES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[vs.pill, details.size === s && vs.pillActive]}
                  onPress={() => setDetails(d => ({ ...d, size: s }))}
                >
                  <Text style={[ts.pillText, details.size === s && ts.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gender */}
            <Text style={ts.fieldLabel}>Gender</Text>
            <View style={vs.pills}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[vs.pill, details.gender === g && vs.pillActive]}
                  onPress={() => setDetails(d => ({ ...d, gender: g }))}
                >
                  <Text style={[ts.pillText, details.gender === g && ts.pillTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <Text style={ts.fieldLabel}>Listing status</Text>
            <View style={vs.pills}>
              {[
                { id: 'live', label: 'Live now' },
                { id: 'paused', label: 'Paused' },
                { id: 'draft', label: 'Draft' },
              ].map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[vs.pill, details.status === status.id && vs.pillActive]}
                  onPress={() => setDetails((d) => ({ ...d, status: status.id as ListingStatus }))}
                >
                  <Text style={[ts.pillText, details.status === status.id && ts.pillTextActive]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price */}
            <Text style={ts.fieldLabel}>Your price</Text>
            <View style={vs.priceRow}>
              <View style={vs.pricePrefix}>
                <Text style={ts.pricePrefixText}>₹</Text>
              </View>
              <TextInput
                style={ts.priceInput}
                placeholder="0"
                placeholderTextColor={Colors.BORDER}
                keyboardType="number-pad"
                value={details.price}
                onChangeText={v => setDetails(d => ({ ...d, price: v.replace(/[^0-9]/g, '') }))}
              />
            </View>

            {details.price ? (
              <View style={vs.earningsRow}>
                <View style={vs.earningsItem}>
                  <Text style={ts.earningsLabel}>You earn</Text>
                  <Text style={[ts.earningsValue, { color: Colors.GREEN }]}>
                    ₹{Math.floor(Number(details.price) * 0.85).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={vs.earningsDivider} />
                <View style={vs.earningsItem}>
                  <Text style={ts.earningsLabel}>Buyer pays</Text>
                  <Text style={ts.earningsValue}>
                    ₹{Math.ceil(Number(details.price) * 1.15).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ) : null}

            {details.status !== 'live' ? (
              <Text style={ts.tip}>
                This item will be saved but hidden from buyers until you switch it to Live.
              </Text>
            ) : null}

            <Text style={ts.tip}>💡 Price 20–30% below retail moves fastest on Roorq</Text>
          </>
        )}

        {/* ══ STEP 3 — STORY SCORE ══ */}
        {step === 2 && (
          <>
            <Text style={ts.stepTitle}>Story Score</Text>
            <Text style={ts.stepSub}>Optional — items with a story sell 3× faster</Text>

            {STORY_QUESTIONS.map(({ key, q }) => (
              <View key={key} style={vs.bubbleWrap}>
                <View style={vs.bubble}>
                  <Text style={ts.bubbleQ}>{q}</Text>
                </View>
                <TextInput
                  style={ts.bubbleInput}
                  placeholder="Type your answer..."
                  placeholderTextColor={Colors.MUTED}
                  value={story[key]}
                  onChangeText={v => setStory(prev => ({ ...prev, [key]: v }))}
                  returnKeyType="next"
                  multiline
                />
              </View>
            ))}
            <Text style={ts.tip}>💡 These become the Story Score badge buyers see on your product</Text>
          </>
        )}

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={vs.bottomBar}>
        {loading ? (
          <View style={vs.loadingBox}>
            <ActivityIndicator color={Colors.WHITE} />
            <Text style={ts.loadingText}>{uploadStep || 'Listing...'}</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={vs.listBtn} onPress={goNext} activeOpacity={0.85}>
              <Text style={ts.listBtnText}>
                {step === STEPS.length - 1 ? 'List it →' : 'Continue →'}
              </Text>
            </TouchableOpacity>
            {step === 2 && (
              <TouchableOpacity onPress={submitListing} style={vs.skipBtn}>
                <Text style={ts.skipText}>Skip Story Score</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

// ── View styles ───────────────────────────────────────────────
const vs = StyleSheet.create<Record<string, ViewStyle>>({
  screen:       { flex: 1, backgroundColor: Colors.WHITE },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.MD, paddingTop: 56, paddingBottom: Spacing.SM, borderBottomWidth: 1, borderBottomColor: Colors.BORDER },
  backBtn:      { width: 40, height: 40, justifyContent: 'center' },
  progressRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.SM, paddingHorizontal: Spacing.MD },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.XS },
  dot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.BORDER, justifyContent: 'center', alignItems: 'center' },
  dotActive:    { backgroundColor: Colors.RED },
  line:         { width: 32, height: 2, backgroundColor: Colors.BORDER, marginHorizontal: 4 },
  lineActive:   { backgroundColor: Colors.RED },
  scroll:       { flex: 1 },
  scrollContent:{ padding: Spacing.MD },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.XS, marginVertical: Spacing.MD },
  thumb:        { width: '30%', aspectRatio: 0.85, borderRadius: Radius.CARD, overflow: 'hidden' },
  removeBtn:    { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  addSlot:      { width: '30%', aspectRatio: 0.85, borderRadius: Radius.CARD, borderWidth: 1.5, borderColor: Colors.BORDER, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  pickBtn:      { height: Size.BUTTON_HEIGHT, backgroundColor: Colors.BLACK, borderRadius: Radius.CARD, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.XS },
  pickBtnOutline: { backgroundColor: Colors.WHITE, borderWidth: 1.5, borderColor: Colors.BORDER },
  pills:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.XS, marginBottom: Spacing.MD },
  pill:         { paddingHorizontal: Spacing.SM, paddingVertical: Spacing.XS, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.BORDER },
  pillActive:   { backgroundColor: Colors.BLACK, borderColor: Colors.BLACK },
  priceRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM },
  pricePrefix:  { width: 48, height: 64, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.CREAM, borderRadius: Radius.INPUT, marginRight: Spacing.XS },
  earningsRow:  { flexDirection: 'row', backgroundColor: Colors.CREAM, borderRadius: Radius.CARD, padding: Spacing.MD, marginBottom: Spacing.SM },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsDivider: { width: 1, backgroundColor: Colors.BORDER },
  bubbleWrap:   { marginBottom: Spacing.MD },
  bubble:       { backgroundColor: Colors.CREAM, borderRadius: Radius.CARD, borderBottomLeftRadius: 4, padding: Spacing.SM, marginBottom: Spacing.XS, alignSelf: 'flex-start', maxWidth: '85%' },
  bottomBar:    { paddingHorizontal: Spacing.MD, paddingBottom: 34, paddingTop: Spacing.SM, borderTopWidth: 1, borderTopColor: Colors.BORDER, backgroundColor: Colors.WHITE },
  listBtn:      { height: Size.BUTTON_HEIGHT, backgroundColor: Colors.RED, borderRadius: Radius.CARD, justifyContent: 'center', alignItems: 'center' },
  skipBtn:      { alignItems: 'center', paddingTop: Spacing.XS, minHeight: 40, justifyContent: 'center' },
  loadingBox:   { height: Size.BUTTON_HEIGHT, backgroundColor: Colors.RED, borderRadius: Radius.CARD, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.XS },
})

// ── Text styles ───────────────────────────────────────────────
const ts = StyleSheet.create<Record<string, TextStyle>>({
  topTitle:       { fontSize: FontSize.MD,   fontWeight: FontWeight.BOLD,    color: Colors.BLACK },
  backArrow:      { fontSize: 18,            color: Colors.BLACK },
  dotNum:         { fontSize: FontSize.XS,   fontWeight: FontWeight.BOLD,    color: Colors.MUTED },
  dotNumActive:   { color: Colors.WHITE },
  dotLabel:       { fontSize: FontSize.XS,   color: Colors.MUTED,            marginLeft: 4 },
  dotLabelActive: { color: Colors.BLACK,     fontWeight: FontWeight.SEMIBOLD },
  stepTitle:      { fontSize: FontSize.XL,   fontWeight: FontWeight.BOLD,    color: Colors.BLACK, marginBottom: 4 },
  stepSub:        { fontSize: FontSize.SM,   color: Colors.MUTED,            marginBottom: Spacing.SM },
  removeBtnText:  { fontSize: 10,            color: Colors.WHITE,            fontWeight: FontWeight.BOLD },
  addIcon:        { fontSize: 28,            color: Colors.MUTED },
  pickBtnText:    { fontSize: FontSize.MD,   fontWeight: FontWeight.SEMIBOLD, color: Colors.WHITE },
  tip:            { fontSize: FontSize.XS,   color: Colors.MUTED,            lineHeight: 18, marginTop: Spacing.XS },
  fieldLabel:     { fontSize: FontSize.SM,   fontWeight: FontWeight.SEMIBOLD, color: Colors.BLACK, marginBottom: Spacing.XS },
  textInput:      { height: Size.BUTTON_HEIGHT, borderWidth: 1.5, borderColor: Colors.BORDER, borderRadius: Radius.INPUT, paddingHorizontal: Spacing.SM, fontSize: FontSize.BASE, color: Colors.BLACK, marginBottom: Spacing.MD },
  pillText:       { fontSize: FontSize.SM,   color: Colors.MUTED },
  pillTextActive: { color: Colors.WHITE,     fontWeight: FontWeight.SEMIBOLD },
  pricePrefixText:{ fontSize: 24,            fontWeight: FontWeight.BOLD,    color: Colors.BLACK },
  priceInput:     { flex: 1,                 fontSize: 48,                   fontWeight: FontWeight.BOLD, color: Colors.BLACK },
  earningsLabel:  { fontSize: FontSize.XS,   color: Colors.MUTED,            marginBottom: 2 },
  earningsValue:  { fontSize: FontSize.LG,   fontWeight: FontWeight.BOLD,    color: Colors.BLACK },
  bubbleQ:        { fontSize: FontSize.BASE,  fontWeight: FontWeight.MEDIUM,  color: Colors.BLACK },
  bubbleInput:    { borderWidth: 1.5,         borderColor: Colors.BORDER,     borderRadius: Radius.INPUT, padding: Spacing.SM, fontSize: FontSize.BASE, color: Colors.BLACK, minHeight: 48 },
  listBtnText:    { fontSize: FontSize.MD,   fontWeight: FontWeight.BOLD,    color: Colors.WHITE },
  skipText:       { fontSize: FontSize.SM,   color: Colors.MUTED },
  loadingText:    { fontSize: FontSize.SM,   color: Colors.WHITE,            fontWeight: FontWeight.MEDIUM },
})

const is = StyleSheet.create<Record<string, ImageStyle>>({
  thumb: { width: '100%', height: '100%' },
})
