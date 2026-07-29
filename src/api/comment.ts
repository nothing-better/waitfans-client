import request, { getData, postData } from './request'
import type { Comment } from '@/types/comment'
import type { Danmu } from '@/types/danmu'

export interface CommentPage {
  comments: Comment[]
  more: boolean
}

export const getComments = (
  vid: number | string,
  offset = 0,
  type: 1 | 2 = 1,
) =>
  getData<CommentPage>('/comment/get', { params: { vid, offset, type } })
export const addComment = (data: FormData) => postData<Comment>('/comment/add', data)
export const getMoreCommentReplies = async (id: number | string) => {
  const response = await request.get<Comment>('/comment/reply/get-more', { params: { id } })
  return response.data
}
export const deleteComment = (data: FormData) => postData<unknown>('/comment/delete', data)
export const toggleCommentLove = (data: FormData) =>
  postData<unknown>('/comment/love-or-not', data)
export const getCommentReactions = () =>
  getData<{ userLike?: number[]; userDislike?: number[] }>('/comment/get-like-and-dislike')
export const getUpLikedComments = (uid: number | string) =>
  getData<number[]>('/comment/get-up-like', { params: { uid } })
export const getDanmuList = (vid: number | string) =>
  getData<Danmu[]>(`/danmu-list/${vid}`)
export const deleteDanmu = (data: FormData) => postData<unknown>('/danmu/delete', data)
