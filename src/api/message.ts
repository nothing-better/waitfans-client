import request, { getData } from './request'

export interface UnreadCounts {
  reply: number
  at: number
  love: number
  system: number
  whisper: number
  dynamic: number
}

export interface ChatMessage {
  id: number
  userId: number
  anotherId: number
  content: string
  createTime: string
  withdraw?: number
  pending?: boolean
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
    list: ChatMessage[]
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
export const getMoreChatDetails = (uid: number | string, offset: number) =>
  getData<{ list: ChatMessage[]; more: boolean }>('/msg/chat-detailed/get-more', {
    params: { uid, offset },
  })
export const deleteChatMessage = async (id: number | string) => {
  const data = new FormData()
  data.append('id', String(id))
  await request.post('/msg/chat-detailed/delete', data)
}
export const setChatOnline = async (uid: number | string) => {
  await request.get('/msg/chat/online', { params: { from: uid } })
}
export const setChatOffline = async (
  from: number | string,
  to: number | string,
) => {
  await request.get('/msg/chat/outline', { params: { from, to } })
}
