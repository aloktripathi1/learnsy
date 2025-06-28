"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase configuration missing. Please add environment variables.")
      setLoading(false)
      return
    }

    // Check for placeholder values
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url_here' ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
      setError("Please update your .env.local file with real Supabase credentials.")
      setLoading(false)
      return
    }

    // Dynamically import supabase only if configured
    import("@/lib/supabase")
      .then(({ supabase, isSupabaseConfigured }) => {
        if (!isSupabaseConfigured() || !supabase) {
          setError("Supabase client initialization failed. Please check your credentials.")
          setLoading(false)
          return
        }

        console.log("🔗 Supabase connection established")

        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.error("Error getting session:", error)
            setError(`Authentication error: ${error.message}`)
          } else {
            setUser(session?.user ?? null)
            console.log("👤 User session:", session?.user ? "Authenticated" : "Not authenticated")
          }
          setLoading(false)
        })

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("🔄 Auth state changed:", event)
          setUser(session?.user ?? null)
          setLoading(false)
        })

        return () => subscription.unsubscribe()
      })
      .catch((err) => {
        console.error("Supabase initialization error:", err)
        setError("Failed to initialize authentication")
        setLoading(false)
      })
  }, [])

  const signIn = async () => {
    if (error) {
      throw new Error("Authentication not available")
    }

    const { supabase, isSupabaseConfigured } = await import("@/lib/supabase")

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Authentication not configured")
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (signInError) throw signInError
  }

  const signInWithGoogle = async () => {
    return signIn()
  }

  const signOut = async () => {
    if (error) return

    const { supabase, isSupabaseConfigured } = await import("@/lib/supabase")

    if (!isSupabaseConfigured() || !supabase) {
      return
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}