import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

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
