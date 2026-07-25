import { useCallback } from 'react'

export function useAuth() {
  const checkAuth = useCallback((): boolean => {
    const token = localStorage.getItem('teri_token')
    return !!token
  }, [])

  return { isLogin: !!localStorage.getItem('teri_token'), user: null, checkAuth }
}
