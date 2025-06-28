import {
  supabase,
  isSupabaseConfigured,
  type Course,
  type Video,
  type UserProgress,
  type StreakActivity,
} from "./supabase"

export interface VideoTimestamp {
  user_id: string
  video_id: string
  timestamp: number
  duration: number
  updated_at: string
}

export class DatabaseService {
  private static checkSupabase() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is not configured. Please check your environment variables.")
    }
    return supabase
  }

  // Courses
  static async getCourses(userId: string): Promise<Course[]> {
    const client = this.checkSupabase()
    console.log("Getting courses for user:", userId)
    const { data, error } = await client
      .from("courses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching courses:", error)
      throw new Error(`Failed to fetch courses: ${error.message}`)
    }

    console.log(`Retrieved ${data?.length || 0} courses`)
    return data || []
  }

  static async createCourse(course: Omit<Course, "id" | "created_at" | "updated_at">): Promise<Course> {
    const client = this.checkSupabase()
    console.log("Creating course:", course)
    const { data, error } = await client.from("courses").insert(course).select().single()

    if (error) {
      console.error("Error creating course:", error)
      throw new Error(`Failed to create course: ${error.message}`)
    }

    if (!data) {
      throw new Error("No data returned after creating course")
    }

    console.log("Course created successfully:", data.id)
    return data
  }

  static async deleteCourse(courseId: string): Promise<void> {
    const client = this.checkSupabase()
    console.log("Deleting course:", courseId)
    const { error } = await client.from("courses").delete().eq("id", courseId)

    if (error) {
      console.error("Error deleting course:", error)
      throw new Error(`Failed to delete course: ${error.message}`)
    }

    console.log("Course deleted successfully")
  }

  // Videos
  static async getVideos(courseId: string): Promise<Video[]> {
    const client = this.checkSupabase()
    console.log("Getting videos for course:", courseId)
    const { data, error } = await client
      .from("videos")
      .select("*")
      .eq("course_id", courseId)
      .order("position", { ascending: true })

    if (error) {
      console.error("Error fetching videos:", error)
      throw new Error(`Failed to fetch videos: ${error.message}`)
    }

    console.log(`Retrieved ${data?.length || 0} videos`)
    return data || []
  }

  static async createVideos(videos: Omit<Video, "id" | "created_at">[]): Promise<Video[]> {
    const client = this.checkSupabase()
    console.log(`Creating ${videos.length} videos`)

    // Insert videos in batches to avoid potential payload size limits
    const batchSize = 50
    const results: Video[] = []

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize)
      console.log(`Inserting batch ${i / batchSize + 1} with ${batch.length} videos`)

      const { data, error } = await client.from("videos").insert(batch).select()

      if (error) {
        console.error("Error creating videos batch:", error)
        throw new Error(`Failed to create videos: ${error.message}`)
      }

      if (data) {
        results.push(...data)
      }
    }

    console.log(`Successfully created ${results.length} videos`)
    return results
  }

  // User Progress
  static async getUserProgress(userId: string, videoId?: string): Promise<UserProgress[]> {
    const client = this.checkSupabase()
    console.log("Getting user progress for user:", userId, videoId ? `and video: ${videoId}` : "")
    let query = client.from("user_progress").select("*").eq("user_id", userId)

    if (videoId) {
      query = query.eq("video_id", videoId)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching user progress:", error)
      throw new Error(`Failed to fetch user progress: ${error.message}`)
    }

    console.log(`Retrieved ${data?.length || 0} progress records`)
    return data || []
  }

  static async updateProgress(
    progress: Partial<UserProgress> & { user_id: string; video_id: string },
  ): Promise<UserProgress | null> {
    const client = this.checkSupabase()
    console.log("Updating progress:", progress)
    const { data, error } = await client
      .from("user_progress")
      .upsert(
        {
          ...progress,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" },
      )
      .select()
      .single()

    if (error) {
      console.error("Error updating progress:", error)
      throw new Error(`Failed to update progress: ${error.message}`)
    }

    console.log("Progress updated successfully")
    return data
  }

  // Streak Activity
  static async getStreakActivity(userId: string): Promise<StreakActivity[]> {
    const client = this.checkSupabase()
    console.log("Getting streak activity for user:", userId)
    const { data, error } = await client
      .from("streak_activity")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching streak activity:", error)
      throw new Error(`Failed to fetch streak activity: ${error.message}`)
    }

    console.log(`Retrieved ${data?.length || 0} streak records`)
    return data || []
  }

  static async updateStreakActivity(userId: string, date: string): Promise<void> {
    const client = this.checkSupabase()
    console.log("Updating streak activity for user:", userId, "date:", date)
    const { error } = await client.from("streak_activity").upsert(
      {
        user_id: userId,
        date,
        videos_watched: 1,
      },
      {
        onConflict: "user_id,date",
        ignoreDuplicates: false,
      },
    )

    if (error) {
      console.error("Error updating streak activity:", error)
      throw new Error(`Failed to update streak activity: ${error.message}`)
    }

    console.log("Streak activity updated successfully")
  }

  // Bookmarks
  static async getBookmarks(userId: string): Promise<any[]> {
    const client = this.checkSupabase()
    console.log("Getting bookmarks for user:", userId)

    const { data, error } = await client
      .from("user_progress")
      .select(`
        id,
        user_id,
        video_id,
        bookmarked,
        notes,
        updated_at,
        videos!inner (
          id,
          video_id,
          title,
          thumbnail,
          duration,
          courses!inner (
            id,
            title
          )
        )
      `)
      .eq("user_id", userId)
      .eq("bookmarked", true)

    if (error) {
      console.error("Error fetching bookmarks:", error)
      throw new Error(`Failed to fetch bookmarks: ${error.message}`)
    }

    // Additional filtering to ensure data integrity
    const validBookmarks = (data || []).filter(
      (bookmark) => bookmark.bookmarked === true && bookmark.videos && bookmark.videos.courses,
    )

    console.log(`Retrieved ${validBookmarks.length} valid bookmarks out of ${data?.length || 0} total records`)
    return validBookmarks
  }

  // Notes
  static async getNotes(userId: string): Promise<any[]> {
    const client = this.checkSupabase()
    console.log("Getting notes for user:", userId)

    const { data, error } = await client
      .from("user_progress")
      .select(`
        id,
        user_id,
        video_id,
        bookmarked,
        notes,
        updated_at,
        videos!inner (
          id,
          video_id,
          title,
          thumbnail,
          duration,
          courses!inner (
            id,
            title
          )
        )
      `)
      .eq("user_id", userId)
      .not("notes", "is", null)
      .neq("notes", "")

    if (error) {
      console.error("Error fetching notes:", error)
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    // Additional filtering to ensure data integrity
    const validNotes = (data || []).filter(
      (note) => note.notes && note.notes.trim() !== "" && note.videos && note.videos.courses,
    )

    console.log(`Retrieved ${validNotes.length} valid notes out of ${data?.length || 0} total records`)
    return validNotes
  }

  // Video Timestamps - NEW METHODS FOR RESUME FEATURE
  static async getVideoTimestamp(userId: string, videoId: string): Promise<VideoTimestamp | null> {
    const client = this.checkSupabase()
    console.log("Getting video timestamp for user:", userId, "video:", videoId)

    const { data, error } = await client
      .from("video_timestamps")
      .select("*")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No timestamp found, return null
        return null
      }
      console.error("Error fetching video timestamp:", error)
      throw new Error(`Failed to fetch video timestamp: ${error.message}`)
    }

    console.log("Retrieved timestamp:", data?.timestamp)
    return data
  }

  static async updateVideoTimestamp(
    userId: string,
    videoId: string,
    timestamp: number,
    duration: number,
  ): Promise<void> {
    const client = this.checkSupabase()
    console.log("Updating video timestamp:", { userId, videoId, timestamp, duration })

    const { error } = await client.from("video_timestamps").upsert(
      {
        user_id: userId,
        video_id: videoId,
        timestamp,
        duration,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" },
    )

    if (error) {
      console.error("Error updating video timestamp:", error)
      throw new Error(`Failed to update video timestamp: ${error.message}`)
    }

    console.log("Video timestamp updated successfully")
  }

  // Course Deletion
  static async deleteCourseWithRelatedData(courseId: string, userId: string): Promise<void> {
    const client = this.checkSupabase()
    console.log("Deleting course and related data:", courseId)

    try {
      // Get all videos for this course first
      const videos = await this.getVideos(courseId)
      const videoIds = videos.map((v) => v.video_id)

      if (videoIds.length > 0) {
        // Delete user progress for all videos in this course
        const { error: progressError } = await client
          .from("user_progress")
          .delete()
          .eq("user_id", userId)
          .in("video_id", videoIds)

        if (progressError) {
          console.error("Error deleting user progress:", progressError)
          throw new Error(`Failed to delete user progress: ${progressError.message}`)
        }

        // Delete video timestamps for all videos in this course
        const { error: timestampError } = await client
          .from("video_timestamps")
          .delete()
          .eq("user_id", userId)
          .in("video_id", videoIds)

        if (timestampError) {
          console.error("Error deleting video timestamps:", timestampError)
          // Don't throw error for timestamps as table might not exist yet
          console.warn("Video timestamps deletion failed, continuing...")
        }
      }

      // Delete all videos for this course
      const { error: videosError } = await client.from("videos").delete().eq("course_id", courseId)

      if (videosError) {
        console.error("Error deleting videos:", videosError)
        throw new Error(`Failed to delete videos: ${videosError.message}`)
      }

      // Finally delete the course
      const { error: courseError } = await client.from("courses").delete().eq("id", courseId).eq("user_id", userId) // Ensure user can only delete their own courses

      if (courseError) {
        console.error("Error deleting course:", courseError)
        throw new Error(`Failed to delete course: ${courseError.message}`)
      }

      console.log("Course and all related data deleted successfully")
    } catch (error) {
      console.error("Error in deleteCourseWithRelatedData:", error)
      throw error
    }
  }
}