import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const SUPABASE_URL = 'https://hczkomkogsbtvvzivavf.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjemtvbWtvZ3NidHZ2eml2YXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzU4OTUsImV4cCI6MjA3OTgxMTg5NX0.wjQWsW0mz9sIzq8BCyrQV3y9ncxIxrBnOS_BJeoqUbQ'

const memoryStorage = new Map()

const webStorageAdapter = {
  getItem: async (key) => {
    if (typeof window === 'undefined') {
      return memoryStorage.get(key) ?? null
    }

    try {
      return window.localStorage.getItem(key)
    } catch {
      return memoryStorage.get(key) ?? null
    }
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') {
      memoryStorage.set(key, value)
      return
    }

    try {
      window.localStorage.setItem(key, value)
    } catch {
      memoryStorage.set(key, value)
    }
  },
  removeItem: async (key) => {
    memoryStorage.delete(key)

    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore storage failures during static rendering or restricted browsers.
    }
  },
}

// Use SecureStore on native devices and degrade safely during web/static export.
const nativeStorageAdapter = {
  getItem: async (key) => {
    if (typeof SecureStore.getItemAsync === 'function') {
      return SecureStore.getItemAsync(key)
    }

    return memoryStorage.get(key) ?? null
  },
  setItem: async (key, value) => {
    if (typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(key, value)
      return
    }

    memoryStorage.set(key, value)
  },
  removeItem: async (key) => {
    if (typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(key)
      return
    }

    memoryStorage.delete(key)
  },
}

const authStorage = Platform.OS === 'web' ? webStorageAdapter : nativeStorageAdapter

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})