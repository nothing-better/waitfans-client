import { getData, postData } from './request'
import type { User, UserCardData } from '@/types/user'
import type { VideoFeedItem } from '@/types/video'

export interface Channel {
  mcId: number
  mcName: string
  children?: Array<{ scId: number; scName: string }>
}

export interface Favorite {
  fid: number
  uid: number
  title: string
  type: number
  count?: number
  cover?: string
}

export const getChannels = () => getData<Channel[]>('/category/getall')
export const getHotSearch = () => getData<string[]>('/search/hot/get')
export const getMatchingWords = (keyword: string) =>
  getData<string[]>('/search/word/get', { params: { keyword: encodeURIComponent(keyword) } })
export const addSearchWord = (keyword: string) => {
  const body = new FormData()
  body.append('keyword', keyword)
  return postData<unknown>('/search/word/add', body)
}
export const getSearchCount = (keyword: string) =>
  getData<[number, number]>('/search/count', { params: { keyword: encodeURIComponent(keyword) } })
export const searchVideos = (keyword: string, page = 1) =>
  getData<VideoFeedItem[]>('/search/video/only-pass', {
    params: { keyword: encodeURIComponent(keyword), page },
  })
export const searchUsers = (keyword: string, page = 1) =>
  getData<Array<UserCardData | User>>('/search/user', {
    params: { keyword: encodeURIComponent(keyword), page },
  })
export const getFavorites = (uid: number | string, authenticated: boolean) =>
  getData<Favorite[]>(authenticated ? '/favorite/get-all/user' : '/favorite/get-all/visitor', {
    params: { uid },
  })
