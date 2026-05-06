import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, ViewStyle, TextStyle,
} from 'react-native'
import { Colors, Spacing, Radius, Size, FontSize, FontWeight } from '@/theme'
import { supabase } from '@/lib/supabase'

type Method    = 'email' | 'phone'
type EmailStep = 'enter_email' | 'enter_otp'
type PhoneStep = 'enter_phone' | 'enter_otp'

export default function LoginScreen() {
  const [method, setMethod]       = useState<Method>('email')
  const [email, setEmail]         = useState('')
  const [emailStep, setEmailStep] = useState<EmailStep>('enter_email')
  const [phone, setPhone]         = useState('')
  const [otp, setOtp]             = useState('')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter_phone')
  const [loading, setLoading]     = useState(false)

  async function sendEmailOtp() {
    if (!email.trim()) return Alert.alert('Enter your email address')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) return Alert.alert('Error', error.message)
    setEmailStep('enter_otp')
  }

  async function verifyEmailOtp() {
    if (otp.length !== 6) return Alert.alert('Enter the 6-digit code')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type:  'email',
    })
    setLoading(false)
    if (error) return Alert.alert('Wrong code', error.message)
  }

  async function sendPhoneOtp() {
    if (phone.length < 10) return Alert.alert('Enter a valid 10-digit number')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` })
    setLoading(false)
    if (error) return Alert.alert('Error', error.message)
    setPhoneStep('enter_otp')
  }

  async function verifyPhoneOtp() {
    if (otp.length !== 6) return Alert.alert('Enter the 6-digit code')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`, token: otp, type: 'sms',
    })
    setLoading(false)
    if (error) return Alert.alert('Wrong code', error.message)
  }

  return (
    <KeyboardAvoidingView
      style={vs.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={vs.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={vs.logoBlock}>
          <Text style={ts.logo}>roorq</Text>
          <Text style={ts.subtitle}>Vendor Portal</Text>
        </View>

        {/* Toggle */}
        <View style={vs.toggle}>
          <TouchableOpacity
            style={[vs.toggleBtn, method === 'email' && vs.toggleActive]}
            onPress={() => setMethod('email')}
            activeOpacity={0.8}
          >
            <Text style={[ts.toggleText, method === 'email' && ts.toggleTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[vs.toggleBtn, method === 'phone' && vs.toggleActive]}
            onPress={() => setMethod('phone')}
            activeOpacity={0.8}
          >
            <Text style={[ts.toggleText, method === 'phone' && ts.toggleTextActive]}>
              ðŸ“± WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* â”€â”€ EMAIL FLOW â”€â”€ */}
        {method === 'email' && emailStep === 'enter_email' && (
          <>
            <Text style={ts.label}>Your email address</Text>
            <TextInput
              style={ts.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={sendEmailOtp}
              returnKeyType="send"
            />
            <TouchableOpacity style={vs.primaryBtn} onPress={sendEmailOtp} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={ts.primaryBtnText}>Send Code â†’</Text>}
            </TouchableOpacity>
            <Text style={ts.hint}>A 6-digit code will be sent to your email.</Text>
          </>
        )}

        {method === 'email' && emailStep === 'enter_otp' && (
          <>
            <View style={vs.sentBadge}>
              <Text style={ts.sentBadgeText}>ðŸ“§ Code sent to {email}</Text>
            </View>
            <Text style={ts.label}>Enter 6-digit code</Text>
            <TextInput
              style={ts.otpInput}
              placeholder="â€¢ â€¢ â€¢ â€¢ â€¢ â€¢"
              placeholderTextColor={Colors.MUTED}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textAlign="center"
              autoFocus
            />
            <TouchableOpacity style={vs.primaryBtn} onPress={verifyEmailOtp} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={ts.primaryBtnText}>Confirm & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmailStep('enter_email'); setOtp('') }} style={vs.backBtn}>
              <Text style={ts.backBtnText}>Use a different email</Text>
            </TouchableOpacity>
          </>
        )}

        {/* â”€â”€ PHONE FLOW â”€â”€ */}
        {method === 'phone' && phoneStep === 'enter_phone' && (
          <>
            <Text style={ts.label}>WhatsApp number</Text>
            <View style={vs.phoneRow}>
              <View style={vs.prefix}>
                <Text style={ts.prefixText}>ðŸ‡®ðŸ‡³ +91</Text>
              </View>
              <TextInput
                style={ts.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor={Colors.MUTED}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <TouchableOpacity style={vs.primaryBtn} onPress={sendPhoneOtp} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={ts.primaryBtnText}>Send OTP</Text>}
            </TouchableOpacity>
            <Text style={ts.hint}>A 6-digit code will be sent to your WhatsApp</Text>
          </>
        )}

        {method === 'phone' && phoneStep === 'enter_otp' && (
          <>
            <Text style={ts.otpSub}>Code sent to +91 {phone}</Text>
            <TextInput
              style={ts.otpInput}
              placeholder="â€¢ â€¢ â€¢ â€¢ â€¢ â€¢"
              placeholderTextColor={Colors.MUTED}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textAlign="center"
            />
            <TouchableOpacity style={vs.primaryBtn} onPress={verifyPhoneOtp} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={ts.primaryBtnText}>Confirm & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPhoneStep('enter_phone'); setOtp('') }} style={vs.backBtn}>
              <Text style={ts.backBtnText}>Change number</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// â”€â”€ View styles only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const vs = StyleSheet.create<Record<string, ViewStyle>>({
  flex:         { flex: 1, backgroundColor: Colors.WHITE },
  container:    { flexGrow: 1, paddingHorizontal: Spacing.MD, paddingTop: 80, paddingBottom: 40 },
  logoBlock:    { marginBottom: Spacing.XL },
  toggle:       { flexDirection: 'row', backgroundColor: Colors.CREAM, borderRadius: Radius.CARD, padding: 4, marginBottom: Spacing.LG },
  toggleBtn:    { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.INPUT },
  toggleActive: { backgroundColor: Colors.WHITE, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  phoneRow:     { flexDirection: 'row', gap: Spacing.XS, marginBottom: Spacing.SM },
  prefix:       { height: Size.BUTTON_HEIGHT, paddingHorizontal: Spacing.SM, borderWidth: 1.5, borderColor: Colors.BORDER, borderRadius: Radius.INPUT, justifyContent: 'center', backgroundColor: Colors.CREAM },
  primaryBtn:   { height: Size.BUTTON_HEIGHT, backgroundColor: Colors.RED, borderRadius: Radius.CARD, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.XS },
  backBtn:      { alignSelf: 'center', marginTop: Spacing.MD, minHeight: Size.TOUCH_TARGET, justifyContent: 'center' },
  sentBadge:    { backgroundColor: Colors.CREAM, borderRadius: Radius.INPUT, padding: Spacing.SM, marginBottom: Spacing.MD },
})

// â”€â”€ Text styles only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ts = StyleSheet.create<Record<string, TextStyle>>({
  logo:            { fontSize: 36, fontWeight: FontWeight.BOLD, color: Colors.BLACK, letterSpacing: -1 },
  subtitle:        { fontSize: FontSize.BASE, color: Colors.MUTED, marginTop: 4 },
  label:           { fontSize: FontSize.SM, fontWeight: FontWeight.SEMIBOLD, color: Colors.BLACK, marginBottom: Spacing.XS },
  toggleText:      { fontSize: FontSize.SM, fontWeight: FontWeight.SEMIBOLD, color: Colors.MUTED },
  toggleTextActive:{ color: Colors.BLACK },
  input:           { height: Size.BUTTON_HEIGHT, borderWidth: 1.5, borderColor: Colors.BORDER, borderRadius: Radius.INPUT, paddingHorizontal: Spacing.SM, fontSize: FontSize.MD, color: Colors.BLACK, backgroundColor: Colors.WHITE, marginBottom: Spacing.SM },
  phoneInput:      { flex: 1, height: Size.BUTTON_HEIGHT, borderWidth: 1.5, borderColor: Colors.BORDER, borderRadius: Radius.INPUT, paddingHorizontal: Spacing.SM, fontSize: FontSize.MD, color: Colors.BLACK },
  otpInput:        { height: Size.BUTTON_HEIGHT, borderWidth: 1.5, borderColor: Colors.BORDER, borderRadius: Radius.INPUT, paddingHorizontal: Spacing.SM, fontSize: 28, fontWeight: FontWeight.BOLD, letterSpacing: 8, color: Colors.BLACK, marginBottom: Spacing.SM },
  otpSub:          { fontSize: FontSize.SM, color: Colors.MUTED, marginBottom: Spacing.SM },
  primaryBtnText:  { fontSize: FontSize.MD, fontWeight: FontWeight.BOLD, color: Colors.WHITE },
  backBtnText:     { fontSize: FontSize.SM, color: Colors.MUTED, textDecorationLine: 'underline' },
  hint:            { fontSize: FontSize.XS, color: Colors.MUTED, textAlign: 'center', marginTop: Spacing.SM },
  prefixText:      { fontSize: FontSize.MD, color: Colors.BLACK, fontWeight: FontWeight.MEDIUM },
  sentBadgeText:   { fontSize: FontSize.SM, color: Colors.MUTED, textAlign: 'center' },
})
