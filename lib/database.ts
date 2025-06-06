import { supabase, type Course, type Video, type UserProgress, type StreakActivity } from "./supabase"

export class DatabaseService {
  // Courses
  static async getCourses(userId: string): Promise<Course[]> {
    console.log("Getting courses for user:", userId)
    const { data, error } = await supabase
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
    console.log("Creating course:", course)
    const { data, error } = await supabase.from("courses").insert(course).select().single()

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
    console.log("Deleting course:", courseId)
    const { error } = await supabase.from("courses").delete().eq("id", courseId)

    if (error) {
      console.error("Error deleting course:", error)
      throw new Error(`Failed to delete course: ${error.message}`)
    }

    console.log("Course deleted successfully")
  }

  // Videos
  static async getVideos(courseId: string): Promise<Video[]> {
    console.log("Getting videos for course:", courseId)
    const { data, error } = await supabase
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
    console.log(`Creating ${videos.length} videos`)

    // Insert videos in batches to avoid potential payload size limits
    const batchSize = 50
    const results: Video[] = []

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize)
      console.log(`Inserting batch ${i / batchSize + 1} with ${batch.length} videos`)

      const { data, error } = await supabase.from("videos").insert(batch).select()

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
    console.log("Getting user progress for user:", userId, videoId ? `and video: ${videoId}` : "")
    let query = supabase.from("user_progress").select("*").eq("user_id", userId)

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
    console.log("Updating progress:", progress)
    const { data, error } = await supabase
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
    console.log("Getting streak activity for user:", userId)
    const { data, error } = await supabase
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
    console.log("Updating streak activity for user:", userId, "date:", date)
    const { error } = await supabase.from("streak_activity").upsert(
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
    console.log("Getting bookmarks for user:", userId)
    const { data, error } = await supabase
      .from("user_progress")
      .select(`
        *,
        videos:video_id (
          *,
          courses:course_id (*)
        )
      `)
      .eq("user_id", userId)
      .eq("bookmarked", true)

    if (error) {
      console.error("Error fetching bookmarks:", error)
      throw new Error(`Failed to fetch bookmarks: ${error.message}`)
    }

    console.log(`Retrieved ${data?.length || 0} bookmarks`)
    return data || []
  }

  // Notes
  static async getNotes(userId: string): Promise<any[]> {
    console.log("Getting notes for user:", userId)
    const { data, error } = await supabase
      .from("user_progress")
      .select(`
        *,
        videos:video_id (
          *,
          courses:course_id (*)
        )
      `)
      .eq("user_id", userId)
      .neq("notes", "")
      .not("notes", "is", null)

    if (error) {
      console.error("Error fetching notes:", error)
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    console.log(`Retrieved ${data?.length || 0} notes`)
    return data || []
  }
}
