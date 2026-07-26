export interface Comment {
  id?: number
  cid?: number
  content: string
  userId?: number
  uid?: number
  nickname?: string
  avatar?: string
  avatar_url?: string
  likes?: number
  good?: number
  dislikes?: number
  bad?: number
  createTime?: string
  commentDate?: string
  children?: Comment[]
  replies?: Comment[]
}
