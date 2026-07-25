export interface Chat {
  id: number
  userId: number
  anotherId: number
  unread: number
  latestTime: string
}

export interface ChatDetail {
  id: number
  userId: number
  anotherId: number
  content: string
  createTime: string
}
