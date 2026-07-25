export interface Video {
  vid: string
  title: string
  cover: string
  duration: number
  author: {
    uid: number
    nickname: string
    avatar: string
  }
  likes: number
  coins: number
  favorites: number
  views: number
  danmuCount: number
  createTime: string
}
