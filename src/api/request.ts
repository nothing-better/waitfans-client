import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types/api'

export const TOKEN_KEY = 'teri_token'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30_000,
  withCredentials: true,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse
    if (payload?.code && payload.code !== 200) {
      message.error(payload.message || '请求失败')
    }
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    const reason = error.response?.headers.message ?? error.response?.data?.message
    if (reason === 'not login' || error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new CustomEvent('waitfans:auth-expired'))
      message.error('登录已过期，请重新登录')
    } else if (error.code !== AxiosError.ERR_CANCELED) {
      message.error(error.response?.data?.message || '服务暂时不可用')
    }
    return Promise.reject(error)
  },
)

export async function getData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.get<ApiResponse<T>>(url, config)
  return response.data.data
}

export async function postData<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await request.post<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export default request
