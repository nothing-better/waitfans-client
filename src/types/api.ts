export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  count?: number
  total?: number
  more?: boolean
}
