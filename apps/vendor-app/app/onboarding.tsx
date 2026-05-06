import { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Size, FontSize, FontWeight } from '@/theme'
import { markOnboardingComplete } from '@/lib/onboarding-state'

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Other']
const CATALOG_TYPES = ['Thrift fashion', 'Streetwear', 'Designer pieces', 'Mixed']
const SPEED_OPTIONS = ['Same day', 'Next day', '2-3 days']

type OnboardingData = {
  ownerName: string
  shopName: string
  whatsapp: string
  city: string
  catalogType: string
  shippingSpeed: string
}

const DEFAULT_DATA: OnboardingData = {
  ownerName: '',
  shopName: '',
  whatsapp: '',
  city: '',
  catalogType: '',
  shippingSpeed: '',
}

export default function OnboardingScreen() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA)

  const canContinue = useMemo(() => {
    if (step === 0) return data.ownerName.trim().length > 1 && data.shopName.trim().length > 1
    if (step === 1) return data.whatsapp.length === 10 && !!data.city
    return !!data.catalogType && !!data.shippingSpeed
  }, [step, data])

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  async function finish() {
    if (!canContinue) return
    setLoading(true)
    try {
      await markOnboardingComplete()
      router.replace('/list-item')
    } catch (error: any) {
      Alert.alert('Try again', error?.message ?? 'Could not complete onboarding.')
    } finally {
      setLoading(false)
    }
  }

  async function skipForNow() {
    await markOnboardingComplete()
    router.replace('/(tabs)')
  }

  return (
    <View style={vs.screen}>
      <View style={vs.topBar}>
        <Text style={ts.logo}>roorq</Text>
        <TouchableOpacity onPress={skipForNow} hitSlop={10}>
          <Text style={ts.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={vs.progressRow}>
        {[0, 1, 2].map((idx) => (
          <View key={idx} style={[vs.progressDot, idx <= step && vs.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={vs.content} showsVerticalScrollIndicator={false}>
        <Text style={ts.title}>Set up your seller profile in under 1 minute</Text>
        <Text style={ts.subtitle}>Faster setup means faster listing and payouts.</Text>

        {step === 0 && (
          <>
            <Text style={ts.label}>Your name</Text>
            <TextInput
              style={vs.input}
              value={data.ownerName}
              onChangeText={(v) => update('ownerName', v)}
              placeholder="e.g. Harish"
              placeholderTextColor={Colors.MUTED}
            />

            <Text style={ts.label}>Shop name</Text>
            <TextInput
              style={vs.input}
              value={data.shopName}
              onChangeText={(v) => update('shopName', v)}
              placeholder="e.g. Fresh Fits Co."
              placeholderTextColor={Colors.MUTED}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={ts.label}>WhatsApp number</Text>
            <View style={vs.phoneRow}>
              <View style={vs.prefix}>
                <Text style={ts.prefixText}>+91</Text>
              </View>
              <TextInput
                style={vs.phoneInput}
                keyboardType="number-pad"
                maxLength={10}
                value={data.whatsapp}
                onChangeText={(v) => update('whatsapp', v.replace(/[^0-9]/g, ''))}
                placeholder="9876543210"
                placeholderTextColor={Colors.MUTED}
              />
            </View>

            <Text style={ts.label}>Pickup city</Text>
            <View style={vs.pills}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[vs.pill, data.city === city && vs.pillActive]}
                  onPress={() => update('city', city)}
                >
                  <Text style={[ts.pillText, data.city === city && ts.pillTextActive]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={ts.label}>What do you sell most?</Text>
            <View style={vs.pills}>
              {CATALOG_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[vs.pill, data.catalogType === type && vs.pillActive]}
                  onPress={() => update('catalogType', type)}
                >
                  <Text style={[ts.pillText, data.catalogType === type && ts.pillTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ts.label}>Typical shipping speed</Text>
            <View style={vs.pills}>
              {SPEED_OPTIONS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[vs.pill, data.shippingSpeed === speed && vs.pillActive]}
                  onPress={() => update('shippingSpeed', speed)}
                >
                  <Text style={[ts.pillText, data.shippingSpeed === speed && ts.pillTextActive]}>{speed}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={vs.hintCard}>
              <Text style={ts.hintTitle}>What happens next</Text>
              <Text style={ts.hintText}>1) List your first product</Text>
              <Text style={ts.hintText}>2) Share your store link</Text>
              <Text style={ts.hintText}>3) Get paid weekly to your payout account</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={vs.bottomBar}>
        {step > 0 ? (
          <TouchableOpacity style={vs.secondaryBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={ts.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={vs.secondaryBtnPlaceholder} />
        )}

        <TouchableOpacity
          style={[vs.primaryBtn, !canContinue && vs.primaryBtnDisabled]}
          disabled={!canContinue || loading}
          onPress={() => {
            if (step < 2) setStep((s) => s + 1)
            else void finish()
          }}
        >
          <Text style={ts.primaryBtnText}>
            {step < 2 ? 'Continue' : loading ? 'Finishing...' : 'Start selling'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const vs = StyleSheet.create<Record<string, ViewStyle>>({
  screen: { flex: 1, backgroundColor: Colors.WHITE },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: Spacing.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.MD, marginTop: Spacing.SM },
  progressDot: { flex: 1, height: 5, borderRadius: 8, backgroundColor: Colors.BORDER },
  progressDotActive: { backgroundColor: Colors.RED },
  content: { paddingHorizontal: Spacing.MD, paddingTop: Spacing.MD, paddingBottom: 24 },
  input: {
    height: Size.BUTTON_HEIGHT,
    borderRadius: Radius.INPUT,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    paddingHorizontal: Spacing.SM,
    fontSize: FontSize.BASE,
    color: Colors.BLACK,
    marginBottom: Spacing.MD,
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.XS, marginBottom: Spacing.MD },
  prefix: {
    height: Size.BUTTON_HEIGHT,
    borderRadius: Radius.INPUT,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    minWidth: 70,
    backgroundColor: Colors.CREAM,
  },
  phoneInput: {
    flex: 1,
    height: Size.BUTTON_HEIGHT,
    borderRadius: Radius.INPUT,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    paddingHorizontal: Spacing.SM,
    fontSize: FontSize.BASE,
    color: Colors.BLACK,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.XS, marginBottom: Spacing.MD },
  pill: {
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    borderRadius: 24,
    paddingHorizontal: Spacing.SM,
    paddingVertical: 10,
  },
  pillActive: { backgroundColor: Colors.BLACK, borderColor: Colors.BLACK },
  hintCard: { backgroundColor: Colors.CREAM, borderRadius: Radius.CARD, padding: Spacing.SM },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
    paddingHorizontal: Spacing.MD,
    paddingTop: Spacing.SM,
    paddingBottom: 34,
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  secondaryBtn: {
    height: Size.BUTTON_HEIGHT,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    borderRadius: Radius.CARD,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
  },
  secondaryBtnPlaceholder: { width: 92 },
  primaryBtn: {
    flex: 1,
    height: Size.BUTTON_HEIGHT,
    backgroundColor: Colors.RED,
    borderRadius: Radius.CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.45 },
})

const ts = StyleSheet.create<Record<string, TextStyle>>({
  logo: { fontSize: 28, color: Colors.BLACK, fontWeight: FontWeight.BOLD, letterSpacing: -1 },
  skip: { color: Colors.MUTED, fontSize: FontSize.SM, fontWeight: FontWeight.SEMIBOLD },
  title: { marginTop: Spacing.SM, fontSize: FontSize.XL, color: Colors.BLACK, fontWeight: FontWeight.BOLD },
  subtitle: { marginTop: 6, marginBottom: Spacing.LG, color: Colors.MUTED, fontSize: FontSize.SM, lineHeight: 20 },
  label: { fontSize: FontSize.SM, color: Colors.BLACK, fontWeight: FontWeight.SEMIBOLD, marginBottom: Spacing.XS },
  prefixText: { fontSize: FontSize.MD, color: Colors.BLACK, fontWeight: FontWeight.MEDIUM },
  pillText: { fontSize: FontSize.SM, color: Colors.MUTED, fontWeight: FontWeight.MEDIUM },
  pillTextActive: { color: Colors.WHITE },
  hintTitle: { fontSize: FontSize.SM, color: Colors.BLACK, fontWeight: FontWeight.BOLD, marginBottom: 8 },
  hintText: { fontSize: FontSize.SM, color: Colors.MUTED, marginBottom: 4 },
  secondaryBtnText: { fontSize: FontSize.SM, color: Colors.BLACK, fontWeight: FontWeight.SEMIBOLD },
  primaryBtnText: { fontSize: FontSize.MD, color: Colors.WHITE, fontWeight: FontWeight.BOLD },
})
