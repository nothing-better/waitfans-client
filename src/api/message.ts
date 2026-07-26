import { getData, postData } from './request'

export interface UnreadCounts {
  reply: number
  at: number
  love: number
  system: number
  whisper: number
  dynamic: number
}

export interface ChatItem {
  chat: {
    id: number
    userId: number
    unread: number
    latestTime: string
  }
  user: {
    uid: number
    nickname: string
    avatar_url?: string
  }
  detail: {
    more: boolean
    list: Array<{
      id: number
      userId: number
      anotherId: number
      content: string
      createTime: string
      withdraw?: number
    }>
  }
}

export const getUnreadCounts = () => getData<UnreadCounts>('/msg-unread/all')
export const clearUnread = (type: string) => {
  const data = new FormData()
  data.append('type', type)
  return postData<unknown>('/msg-unread/clear', data)
}
export const getRecentChats = (page = 1) =>
  getData<ChatItem[]>('/msg/chat/recent-list', { params: { page } })
export const createChat = (uid: number | string) =>
  getData<ChatItem>(`/msg/chat/create/${uid}`)
