import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper function to validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Create a conditional client that only initializes if env vars are present and valid
export const supabase = (() => {
  // Check if environment variables exist and are not placeholder values
  if (!supabaseUrl || 
      !supabaseAnonKey || 
      supabaseUrl === 'your_supabase_project_url_here' ||
      supabaseAnonKey === 'your_supabase_anon_key_here' ||
      !isValidUrl(supabaseUrl)) {
    console.warn("Supabase environment variables not configured properly. Please update your .env.local file with valid Supabase credentials.")
    return null
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return null
  }
})()

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && 
           supabaseAnonKey && 
           supabase &&
           supabaseUrl !== 'your_supabase_project_url_here' &&
           supabaseAnonKey !== 'your_supabase_anon_key_here' &&
           isValidUrl(supabaseUrl))
}

// Database types
export interface Course {
  id: string
  user_id: string
  playlist_id: string
  title: string
  thumbnail: string
  video_count: number
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  course_id: string
  video_id: string
  title: string
  thumbnail: string
  duration: string
  position: number
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  video_id: string
  completed: boolean
  bookmarked: boolean
  notes: string
  completed_at?: string
  updated_at: string
}

export interface StreakActivity {
  id: string
  user_id: string
  date: string
  videos_watched: number
  created_at: string
}

export interface VideoTimestamp {
  id: string
  user_id: string
  video_id: string
  timestamp: number
  duration: number
  updated_at: string
}