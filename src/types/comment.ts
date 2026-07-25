export interface Comment {
  id: number
  content: string
  userId: number
  nickname: string
  avatar: string
  likes: number
  dislikes: number
  createTime: string
  children?: Comment[]
}
