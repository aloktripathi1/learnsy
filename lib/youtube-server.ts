// Server-side YouTube API functions
export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  duration: string
  position: number
}

export interface YouTubePlaylist {
  id: string
  title: string
  thumbnail: string
  videos: YouTubeVideo[]
}

export function extractPlaylistId(url: string): string | null {
  console.log("Extracting playlist ID from URL:", url)

  // Handle different YouTube playlist URL formats
  const patterns = [
    /[&?]list=([^&]+)/,
    /playlist\?list=([^&]+)/,
    /youtube\.com\/playlist\?list=([^&]+)/,
    /youtu\.be\/.*[?&]list=([^&]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      console.log("Extracted playlist ID:", match[1])
      return match[1]
    }
  }

  console.log("No playlist ID found in URL")
  return null
}

export async function fetchPlaylistData(playlistId: string): Promise<YouTubePlaylist> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

  if (!YOUTUBE_API_KEY) {
    console.error("YouTube API key not configured")
    throw new Error("YouTube API key not configured on server")
  }

  console.log(`Fetching playlist data for ID: ${playlistId}`)
  console.log(
    `Using YouTube API key: ${YOUTUBE_API_KEY.substring(0, 3)}...${YOUTUBE_API_KEY.substring(YOUTUBE_API_KEY.length - 3)}`,
  )

  try {
    // Fetch playlist details
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
    console.log("Fetching playlist details from URL:", playlistUrl)

    const playlistResponse = await fetch(playlistUrl)

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text()
      console.error("Playlist API error:", playlistResponse.status, errorText)
      throw new Error(`YouTube API error: ${playlistResponse.status} - ${errorText}`)
    }

    const playlistData = await playlistResponse.json()
    console.log("Playlist response:", JSON.stringify(playlistData, null, 2))

    if (!playlistData.items || playlistData.items.length === 0) {
      console.error("Playlist not found or is private")
      throw new Error("Playlist not found or is private")
    }

    const playlist = playlistData.items[0]

    // Fetch playlist items
    const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    console.log("Fetching playlist items from URL:", itemsUrl)

    const itemsResponse = await fetch(itemsUrl)

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text()
      console.error("Playlist items API error:", itemsResponse.status, errorText)
      throw new Error(`YouTube API error: ${itemsResponse.status} - ${errorText}`)
    }

    const itemsData = await itemsResponse.json()
    console.log("Playlist items count:", itemsData.items?.length || 0)

    if (!itemsData.items || itemsData.items.length === 0) {
      console.error("No videos found in playlist")
      throw new Error("No videos found in playlist")
    }

    // Get video details for durations
    const videoIds = itemsData.items
      .map((item: any) => item.snippet?.resourceId?.videoId)
      .filter(Boolean)
      .join(",")

    if (!videoIds) {
      console.error("No valid video IDs found in playlist")
      throw new Error("No valid video IDs found in playlist")
    }

    console.log("Fetching video details for IDs:", videoIds)

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    const videosResponse = await fetch(videosUrl)

    if (!videosResponse.ok) {
      const errorText = await videosResponse.text()
      console.error("Videos API error:", videosResponse.status, errorText)
      throw new Error(`YouTube API error: ${videosResponse.status} - ${errorText}`)
    }

    const videosData = await videosResponse.json()
    console.log("Videos details count:", videosData.items?.length || 0)

    // Create video objects
    const videos: YouTubeVideo[] = itemsData.items
      .map((item: any, index: number) => {
        const videoId = item.snippet?.resourceId?.videoId
        if (!videoId) {
          console.log("Skipping item with no videoId:", item)
          return null
        }

        const videoDetails = videosData.items?.find((v: any) => v.id === videoId)
        const duration = videoDetails ? formatDuration(videoDetails.contentDetails.duration) : "0:00"

        return {
          id: videoId,
          title: item.snippet?.title || "Untitled Video",
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            "/placeholder.svg?height=180&width=320",
          duration,
          position: index,
        }
      })
      .filter(Boolean)

    if (videos.length === 0) {
      console.error("No valid videos found in playlist")
      throw new Error("No valid videos found in playlist")
    }

    console.log(`Successfully processed ${videos.length} videos`)

    return {
      id: playlistId,
      title: playlist.snippet?.title || "Untitled Playlist",
      thumbnail:
        playlist.snippet?.thumbnails?.medium?.url ||
        playlist.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=180&width=320",
      videos,
    }
  } catch (error) {
    console.error("Error fetching playlist data:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to fetch playlist data")
  }
}

function formatDuration(duration: string): string {
  try {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1]?.replace("H", "") || "0")
    const minutes = Number.parseInt(match[2]?.replace("M", "") || "0")
    const seconds = Number.parseInt(match[3]?.replace("S", "") || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  } catch (error) {
    console.error("Error formatting duration:", duration, error)
    return "0:00"
  }
}
