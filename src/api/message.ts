import request, { getData } from './request'

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
export const clearUnread = async (column: string) => {
  const data = new FormData()
  data.append('column', column)
  await request.post('/msg-unread/clear', data)
}
export const getRecentChats = (offset = 0) =>
  getData<{ list: ChatItem[]; more: boolean }>('/msg/chat/recent-list', { params: { offset } })
export const createChat = (uid: number | string) =>
  getData<ChatItem>(`/msg/chat/create/${uid}`)
export const deleteChat = (uid: number | string) =>
  getData<unknown>(`/msg/chat/delete/${uid}`)
export const setChatOnline = async (uid: number | string) => {
  await request.get('/msg/chat/online', { params: { from: uid } })
}
export const setChatOffline = async (
  from: number | string,
  to: number | string,
) => {
  await request.get('/msg/chat/outline', { params: { from, to } })
}
