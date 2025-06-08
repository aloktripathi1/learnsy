"use server"

import { extractPlaylistId, fetchPlaylistData, validatePlaylistUrl } from "@/lib/youtube-server"
import { DatabaseService } from "@/lib/database"

const MAX_PLAYLISTS_PER_USER = 4

export async function importPlaylistAction(playlistUrl: string, userId: string) {
  console.log("Starting playlist import for user:", userId)
  console.log("Playlist URL:", playlistUrl)

  try {
    // Validate inputs
    if (!playlistUrl || !userId) {
      return {
        success: false,
        error: "Missing required information. Please try again.",
      }
    }

    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      console.error("YouTube API key not configured")
      return {
        success: false,
        error: "YouTube API is not configured on the server. Please contact the administrator.",
      }
    }

    console.log("YouTube API key is configured")

    // Check playlist limit BEFORE any other operations
    console.log("Checking playlist limit...")
    try {
      const existingCourses = await DatabaseService.getCourses(userId)
      console.log("User has", existingCourses.length, "existing playlists")

      if (existingCourses.length >= MAX_PLAYLISTS_PER_USER) {
        console.log("Playlist limit reached for user:", userId)
        return {
          success: false,
          error: "Limit reached. Complete or delete a playlist to import more.",
          limitReached: true,
        }
      }
    } catch (dbError) {
      console.error("Error checking playlist limit:", dbError)
      return {
        success: false,
        error: "Database error: Could not check playlist limit. Please try again.",
      }
    }

    // Validate URL format first
    const urlValidation = validatePlaylistUrl(playlistUrl)
    if (!urlValidation.isValid) {
      console.log("URL validation failed:", urlValidation.error)
      return {
        success: false,
        error: urlValidation.error || "Invalid playlist URL format.",
      }
    }

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl)
    console.log("Extracted playlist ID:", playlistId)

    if (!playlistId) {
      return {
        success: false,
        error:
          "Could not extract playlist ID from URL. Please ensure you're using a valid YouTube playlist URL with 'list=' parameter.",
      }
    }

    // Check if course already exists (after limit check)
    console.log("Checking for existing course...")
    try {
      const existingCourses = await DatabaseService.getCourses(userId)
      const existingCourse = existingCourses.find((course) => course.playlist_id === playlistId)
      if (existingCourse) {
        console.log("Course already exists:", existingCourse.id)
        return {
          success: false,
          error: `This playlist "${existingCourse.title}" has already been imported.`,
        }
      }
    } catch (dbError) {
      console.error("Error checking existing courses:", dbError)
      return {
        success: false,
        error: "Database error: Could not check existing courses. Please try again.",
      }
    }

    // Fetch playlist data from YouTube
    console.log("Fetching playlist data from YouTube...")
    let playlistData
    try {
      playlistData = await fetchPlaylistData(playlistId)
      console.log("Playlist data fetched successfully:", {
        title: playlistData.title,
        videoCount: playlistData.videos.length,
      })

      // Validate playlist has videos
      if (!playlistData.videos || playlistData.videos.length === 0) {
        return {
          success: false,
          error: "This playlist appears to be empty or all videos are private/deleted.",
        }
      }
    } catch (ytError) {
      console.error("YouTube API error:", ytError)

      if (ytError instanceof Error) {
        // Return specific YouTube API errors
        return {
          success: false,
          error: ytError.message,
        }
      }

      return {
        success: false,
        error: "Failed to fetch playlist data from YouTube. Please check the URL and try again.",
      }
    }

    // Double-check limit before creating course (race condition protection)
    console.log("Final playlist limit check before creation...")
    try {
      const finalCourseCheck = await DatabaseService.getCourses(userId)
      if (finalCourseCheck.length >= MAX_PLAYLISTS_PER_USER) {
        console.log("Playlist limit reached during import process for user:", userId)
        return {
          success: false,
          error: "Limit reached. Complete or delete a playlist to import more.",
          limitReached: true,
        }
      }
    } catch (dbError) {
      console.error("Error in final playlist limit check:", dbError)
      return {
        success: false,
        error: "Database error: Could not verify playlist limit. Please try again.",
      }
    }

    // Create course in database
    console.log("Creating course in database...")
    let course
    try {
      // Ensure all required fields are present
      const courseData = {
        user_id: userId,
        playlist_id: playlistId,
        title: playlistData.title || "Untitled Playlist",
        thumbnail: playlistData.thumbnail || "",
        video_count: playlistData.videos.length,
      }

      console.log("Course data to insert:", courseData)

      course = await DatabaseService.createCourse(courseData)
      console.log("Course created with ID:", course.id)
    } catch (dbError) {
      console.error("Error creating course:", dbError)

      let errorMessage = "Database error: Could not create course."

      if (dbError instanceof Error) {
        if (dbError.message.includes("not configured")) {
          errorMessage = "Database is not configured. Please check your Supabase settings."
        } else if (dbError.message.includes("duplicate")) {
          errorMessage = "This playlist has already been imported."
        } else {
          errorMessage = `Database error: ${dbError.message}`
        }
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    // Create videos in database
    console.log("Creating videos in database...")
    try {
      const videos = playlistData.videos.map((video) => ({
        course_id: course.id,
        video_id: video.id,
        title: video.title || "Untitled Video",
        thumbnail: video.thumbnail || "",
        duration: video.duration || "0:00",
        position: video.position,
      }))

      console.log("Video data to insert:", videos.length, "videos")

      const createdVideos = await DatabaseService.createVideos(videos)
      console.log("Videos created successfully:", createdVideos.length)

      return {
        success: true,
        course: {
          ...course,
          videoCount: createdVideos.length,
        },
        message: `Successfully imported "${playlistData.title}" with ${createdVideos.length} videos!`,
      }
    } catch (dbError) {
      console.error("Error creating videos:", dbError)

      // Try to clean up the course if video creation fails
      try {
        console.log("Attempting to clean up course due to video creation failure")
        await DatabaseService.deleteCourse(course.id)
        console.log("Course cleanup successful")
      } catch (cleanupError) {
        console.error("Failed to clean up course after video creation error:", cleanupError)
      }

      let errorMessage = "Database error: Could not create videos."

      if (dbError instanceof Error) {
        errorMessage = `Database error: ${dbError.message}`
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  } catch (error) {
    console.error("Import error (top level):", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("not found")) {
        return {
          success: false,
          error: "Playlist not found. Please check the URL and make sure the playlist is public.",
        }
      }
      if (error.message.includes("private")) {
        return {
          success: false,
          error: "This playlist is private. Please make sure the playlist is public or unlisted.",
        }
      }
      if (error.message.includes("quota")) {
        return {
          success: false,
          error: "YouTube API quota exceeded. Please try again in a few minutes.",
        }
      }
      if (error.message.includes("API")) {
        return {
          success: false,
          error: "YouTube API error. Please try again in a few minutes.",
        }
      }
      if (error.message.includes("network") || error.message.includes("fetch")) {
        return {
          success: false,
          error: "Network error. Please check your internet connection and try again.",
        }
      }

      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

// Helper function to check if user can import more playlists
export async function checkPlaylistLimit(userId: string) {
  try {
    const courses = await DatabaseService.getCourses(userId)
    const currentCount = courses.length
    const maxCount = MAX_PLAYLISTS_PER_USER
    const remaining = Math.max(0, maxCount - currentCount)

    console.log("Playlist limit check:", {
      userId,
      currentCount,
      maxCount,
      remaining,
      canImport: currentCount < maxCount,
    })

    return {
      canImport: currentCount < maxCount,
      currentCount: currentCount,
      maxCount: maxCount,
      remaining: remaining,
    }
  } catch (error) {
    console.error("Error checking playlist limit:", error)
    return {
      canImport: false,
      currentCount: 0,
      maxCount: MAX_PLAYLISTS_PER_USER,
      remaining: 0,
      error: "Could not check playlist limit",
    }
  }
}
