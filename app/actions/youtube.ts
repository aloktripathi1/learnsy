"use server"

import { extractPlaylistId, fetchPlaylistData } from "@/lib/youtube-server"
import { DatabaseService } from "@/lib/database"

export async function importPlaylistAction(playlistUrl: string, userId: string) {
  console.log("Starting playlist import for user:", userId)
  console.log("Playlist URL:", playlistUrl)

  try {
    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      console.error("YouTube API key not configured")
      return {
        success: false,
        error: "YouTube API is not configured on the server. Please contact the administrator.",
      }
    }

    console.log("YouTube API key is configured")

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl)
    console.log("Extracted playlist ID:", playlistId)

    if (!playlistId) {
      return {
        success: false,
        error: "Please enter a valid YouTube playlist URL. Make sure it contains 'list=' parameter.",
      }
    }

    // Check if course already exists
    console.log("Checking for existing course...")
    try {
      const existingCourses = await DatabaseService.getCourses(userId)
      console.log("Existing courses:", existingCourses.length)

      const existingCourse = existingCourses.find((course) => course.playlist_id === playlistId)
      if (existingCourse) {
        console.log("Course already exists:", existingCourse.id)
        return {
          success: false,
          error: "This playlist has already been imported.",
        }
      }
    } catch (dbError) {
      console.error("Error checking existing courses:", dbError)
      return {
        success: false,
        error:
          "Database error: Could not check existing courses. " +
          (dbError instanceof Error ? dbError.message : "Unknown error"),
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
    } catch (ytError) {
      console.error("YouTube API error:", ytError)
      return {
        success: false,
        error: "YouTube API error: " + (ytError instanceof Error ? ytError.message : "Failed to fetch playlist data"),
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
      return {
        success: false,
        error:
          "Database error: Could not create course. " + (dbError instanceof Error ? dbError.message : "Unknown error"),
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
      }
    } catch (dbError) {
      console.error("Error creating videos:", dbError)

      // Try to clean up the course if video creation fails
      try {
        console.log("Attempting to clean up course due to video creation failure")
        await DatabaseService.deleteCourse(course.id)
      } catch (cleanupError) {
        console.error("Failed to clean up course after video creation error:", cleanupError)
      }

      return {
        success: false,
        error:
          "Database error: Could not create videos. " + (dbError instanceof Error ? dbError.message : "Unknown error"),
      }
    }
  } catch (error) {
    console.error("Import error (top level):", error)

    // Provide more specific error messages
    if (error instanceof Error) {
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
      if (error.message.includes("API")) {
        return {
          success: false,
          error: "YouTube API error. Please try again in a few minutes.",
        }
      }
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to import playlist. Please try again.",
    }
  }
}
