'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

type AuthContextValue = {
  loading: boolean
  session: Session | null
  user: User | null
  userRole: string | null
  userType: string | null
  supabase: SupabaseClient
  refreshSession: () => Promise<Session | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const getUserAccessProfile = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, user_type')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.debug('Auth access profile lookup failed', {
        message: error.message,
        userId,
      })
      return { role: null, userType: null }
    }

    return {
      role: typeof data?.role === 'string' ? data.role : null,
      userType: typeof data?.user_type === 'string' ? data.user_type : null,
    }
  } catch (error) {
    logger.debug('Auth access profile lookup threw', {
      userId,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return { role: null, userType: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let requestId = 0

    const applySession = async (
      nextSession: Session | null,
      source: 'bootstrap' | 'listener' | 'refresh',
      event?: string
    ) => {
      const currentRequestId = ++requestId
      const nextUser = nextSession?.user ?? null

      if (!isMounted) return

      setSession(nextSession)
      setUser(nextUser)

      logger.debug('Auth session update', {
        source,
        event: event ?? null,
        hasSession: Boolean(nextSession),
        userId: nextUser?.id ?? null,
      })

      if (!nextUser) {
        setUserRole(null)
        setUserType(null)
        setLoading(false)
        return
      }

      const accessProfile = await getUserAccessProfile(supabase, nextUser.id)

      if (!isMounted || currentRequestId !== requestId) {
        return
      }

      setUserRole(accessProfile.role)
      setUserType(accessProfile.userType)
      setLoading(false)
    }

    const bootstrap = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.debug('Auth bootstrap failed', { message: error.message })
        }

        await applySession(initialSession ?? null, 'bootstrap', 'INITIAL_SESSION')
      } catch (error) {
        logger.debug('Auth bootstrap threw', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        if (isMounted) {
          setSession(null)
          setUser(null)
          setUserRole(null)
          setUserType(null)
          setLoading(false)
        }
      }
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void applySession(nextSession ?? null, 'listener', event)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      userRole,
      userType,
      supabase,
      refreshSession: async () => {
        try {
          const {
            data: { session: nextSession },
            error,
          } = await supabase.auth.getSession()

          if (error) {
            logger.debug('Auth refresh failed', { message: error.message })
          }

          setSession(nextSession ?? null)
          setUser(nextSession?.user ?? null)

          if (!nextSession?.user) {
            setUserRole(null)
            setUserType(null)
            return null
          }

          const accessProfile = await getUserAccessProfile(supabase, nextSession.user.id)
          setUserRole(accessProfile.role)
          setUserType(accessProfile.userType)
          return nextSession
        } catch (error) {
          logger.debug('Auth refresh threw', {
            message: error instanceof Error ? error.message : 'Unknown error',
          })
          return null
        }
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
          throw error
        }
      },
    }),
    [loading, session, supabase, user, userRole, userType]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
