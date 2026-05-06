import * as SecureStore from 'expo-secure-store'

const ONBOARDING_KEY = 'roorq_vendor_onboarding_v1'

export async function hasFinishedOnboarding() {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY)
  return value === 'done'
}

export async function markOnboardingComplete() {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'done')
}
