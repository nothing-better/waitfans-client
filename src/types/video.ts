import type { User } from './user'

export interface Video {
  vid: number | string
  title: string
  cover?: string
  coverUrl?: string
  videoUrl?: string
  duration: number
  uploadDate?: string
  createTime?: string
  descr?: string
  tags?: string
  type?: number
  auth?: number
  status?: number
  top?: number
}

export interface VideoStats {
  play: number
  danmu: number
  good?: number
  coin?: number
  collect?: number
  share?: number
  comment?: number
}

export interface VideoFeedItem {
  video: Video
  user: User
  stats: VideoStats
}

export interface VideoDetailData extends VideoFeedItem {
  category?: {
    mcId?: number
    mcName?: string
    scId?: number
    scName?: string
  }
}

export interface CarouselItem {
  url: string
  title: string
  color: string
  target: string
}
