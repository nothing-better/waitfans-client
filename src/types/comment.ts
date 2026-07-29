export interface Comment {
  id?: number
  cid?: number
  content: string
  vid?: number
  userId?: number
  uid?: number
  rootId?: number
  parentId?: number
  toUserId?: number
  count?: number
  nickname?: string
  avatar?: string
  avatar_url?: string
  user?: {
    uid?: number
    nickname?: string
    avatar?: string
    avatar_url?: string
  }
  toUser?: {
    uid?: number
    nickname?: string
  }
  likes?: number
  good?: number
  love?: number
  dislikes?: number
  bad?: number
  createTime?: string
  commentDate?: string
  isTop?: number
  isDeleted?: number
  children?: Comment[]
  replies?: Comment[]
}
