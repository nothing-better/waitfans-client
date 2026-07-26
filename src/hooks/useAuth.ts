import { useCallback } from 'react'
import { useAppSelector } from '@/store/hooks'

export function useAuth() {
  const { authenticated, current } = useAppSelector((state) => state.user)
  const checkAuth = useCallback((): boolean => {
    const token = localStorage.getItem('teri_token')
    return !!token
  }, [])

  return { isLogin: authenticated, user: current, checkAuth }
}
