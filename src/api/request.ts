import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teri_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const { code, message: msg } = response.data
    if (code && code !== 200) {
      message.error(msg || '请求失败')
    }
    return response
  },
  (error) => {
    const responseData = error.response?.data
    if (responseData?.message === 'not login') {
      localStorage.removeItem('teri_token')
      message.error('请登录后查看')
    } else {
      message.error('特丽丽被玩坏了(¯﹃¯)')
    }
    return Promise.reject(error)
  },
)

export default request
