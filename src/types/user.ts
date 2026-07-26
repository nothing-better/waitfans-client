export interface User {
  uid: number
  nickname: string
  username: string
  avatar?: string
  avatar_url?: string
  role?: number
  exp: number
  sign?: string
  description?: string
  gender?: number
  vip?: number
  auth?: number
  fansCount?: number
  followCount?: number
  state?: number
}

export interface LoginPayload {
  token: string
  user: User
}

export interface UserCardData {
  user: User
  fansCount?: number
  videoCount?: number
}
