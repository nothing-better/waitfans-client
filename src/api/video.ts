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
export const getUserWorks = (
  uid: number | string,
  page = 1,
  rule: 1 | 2 | 3 = 1,
  quantity = 30,
) =>
  getData<{ count: number; list: VideoFeedItem[] }>('/video/user-works', {
    params: { uid, rule, page, quantity },
  })
export const getUserLovedVideos = (
  uid: number | string,
  offset = 0,
  quantity = 30,
) =>
  getData<VideoFeedItem[]>('/video/user-love', { params: { uid, offset, quantity } })
export const getUserCollectedVideos = (
  fid: number | string,
  page = 1,
  rule: 1 | 2 | 3 = 1,
  quantity = 30,
) =>
  getData<VideoFeedItem[]>('/video/user-collect', {
    params: { fid, rule, page, quantity },
  })
export const toggleVideoLove = (data: FormData) =>
  postData<{ love: number; unlove: number; coin: number; collect: number }>(
    '/video/love-or-not',
    data,
  )
export const addVideo = (data: FormData) => postData<unknown>('/video/add', data)
export const askChunk = (hash: string) =>
  getData<number | boolean>('/video/ask-chunk', { params: { hash } })
export const uploadChunk = (data: FormData, signal?: AbortSignal) =>
  postData<unknown>('/video/upload-chunk', data, { signal })
export const cancelUpload = (hash: string) =>
  getData<unknown>('/video/cancel-upload', { params: { hash } })
