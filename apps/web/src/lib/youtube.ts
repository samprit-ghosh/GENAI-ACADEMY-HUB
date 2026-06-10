/**
 * Extracts the video ID from a YouTube URL.
 * Returns null if the URL is not a valid YouTube video URL or if no video ID is found.
 */
export function getYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.substring(1);
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/watch")) {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.includes("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split(/[?#]/)[0] || null;
      }
      if (parsed.pathname.includes("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split(/[?#]/)[0] || null;
      }
      if (parsed.pathname.includes("/v/")) {
        return parsed.pathname.split("/v/")[1]?.split(/[?#]/)[0] || null;
      }
    }
  } catch (e) {
    // Return null if URL parsing fails
  }
  return null;
}

/**
 * Extracts the playlist ID from a YouTube URL.
 * Returns null if no playlist parameter (list=) is found.
 */
export function getYoutubePlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("list");
  } catch (e) {
    return null;
  }
}
