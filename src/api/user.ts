import request, { getData, postData, TOKEN_KEY } from './request'
import type { LoginPayload, User } from '@/types/user'

export interface Credentials {
  username: string
  password: string
}

export const login = (values: Credentials) =>
  postData<LoginPayload>('/user/account/login', values)

export const register = (values: Credentials & { confirmedPassword: string }) =>
  postData<null>('/user/account/register', values)

export const getPersonalInfo = () => getData<User>('/user/personal/info')

export const getUserInfo = (uid: number | string) =>
  getData<User>('/user/info/get-one', { params: { uid } })

export async function logout(): Promise<void> {
  try {
    await request.get('/user/account/logout')
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const updateProfile = (data: FormData) =>
  postData<User | null>('/user/info/update', data)

export const updatePassword = (data: FormData) =>
  postData<null>('/user/password/update', data)

export const updateAvatar = (data: FormData) =>
  postData<string>('/user/avatar/update', data)
