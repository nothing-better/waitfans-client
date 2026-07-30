const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function getVideoPlaybackUrl(vid: number | string) {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  return `${base}/media/video/${encodeURIComponent(String(vid))}`
}
