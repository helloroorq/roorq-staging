import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { Colors } from '@/theme'
import { hasFinishedOnboarding } from '@/lib/onboarding-state'

export default function Index() {
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const value = await hasFinishedOnboarding()
        if (mounted) setDone(value)
      } finally {
        if (mounted) setReady(true)
      }
    })()

    return () => { mounted = false }
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE }}>
        <ActivityIndicator color={Colors.RED} />
      </View>
    )
  }

  return <Redirect href={done ? '/(tabs)' : '/onboarding'} />
}
