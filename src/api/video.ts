import { getData, postData } from './request'
import type { VideoDetailData, VideoFeedItem } from '@/types/video'

export interface CumulativeVideos {
  videos: VideoFeedItem[]
  vids: number[]
  more: boolean
}

export const getRandomVideos = () => getData<VideoFeedItem[]>('/video/random/visitor')
export const getCumulativeVideos = (vids: Array<number | string>) =>
  getData<CumulativeVideos>('/video/cumulative/visitor', {
    params: { vids: vids.join(',') },
  })
export const getVideoDetail = (vid: number | string) =>
  getData<VideoDetailData>('/video/getone', { params: { vid } })
export const getUserWorks = (uid: number | string, page = 1) =>
  getData<{ count: number; list: VideoFeedItem[] }>('/video/user-works', {
    params: { uid, page },
  })
export const getUserLovedVideos = (uid: number | string) =>
  getData<VideoFeedItem[]>('/video/user-love', { params: { uid } })
export const getUserCollectedVideos = (fid: number | string, page = 1) =>
  getData<VideoFeedItem[]>('/video/user-collect', { params: { fid, page } })
export const toggleVideoLove = (data: FormData) =>
  postData<{ love: number; unlove: number; coin: number; collect: number }>(
    '/video/love-or-not',
    data,
  )
export const addVideo = (data: FormData) => postData<unknown>('/video/add', data)
export const askChunk = (hash: string) =>
  getData<number | boolean>('/video/ask-chunk', { params: { hash } })
export const uploadChunk = (data: FormData) =>
  postData<unknown>('/video/upload-chunk', data)
export const cancelUpload = (hash: string) =>
  getData<unknown>('/video/cancel-upload', { params: { hash } })
