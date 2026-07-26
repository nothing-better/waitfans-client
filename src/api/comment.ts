import { getData, postData } from './request'
import type { Comment } from '@/types/comment'
import type { Danmu } from '@/types/danmu'

export const getComments = (vid: number | string, page = 1) =>
  getData<Comment[]>('/comment/get', { params: { vid, page } })
export const addComment = (data: FormData) => postData<Comment>('/comment/add', data)
export const deleteComment = (data: FormData) => postData<unknown>('/comment/delete', data)
export const toggleCommentLove = (data: FormData) =>
  postData<unknown>('/comment/love-or-not', data)
export const getDanmuList = (vid: number | string) =>
  getData<Danmu[]>(`/danmu-list/${vid}`)
export const deleteDanmu = (data: FormData) => postData<unknown>('/danmu/delete', data)
