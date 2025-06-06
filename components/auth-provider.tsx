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

    // Dynamically import supabase only if configured
    import("@/lib/supabase")
      .then(({ supabase }) => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null)
          setLoading(false)
        })

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
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

    const { supabase } = await import("@/lib/supabase")
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

    const { supabase } = await import("@/lib/supabase")
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
