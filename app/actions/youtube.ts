"use server"

import { extractPlaylistId, fetchPlaylistData, validatePlaylistUrl } from "@/lib/youtube-server"

const MAX_PLAYLISTS_PER_USER = 4

// Note: This is a server action that won't work in static export
// For static deployment, this functionality needs to be moved to API routes
export async function importPlaylistAction(playlistUrl: string, userId: string) {
  // This function will need to be converted to an API route for static deployment
  throw new Error("Server actions are not supported in static export. Please use API routes instead.")
}

// Helper function to check if user can import more playlists
export async function checkPlaylistLimit(userId: string) {
  // This function will need to be converted to an API route for static deployment
  throw new Error("Server actions are not supported in static export. Please use API routes instead.")
}