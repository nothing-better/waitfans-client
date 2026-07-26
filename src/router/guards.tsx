import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAppSelector } from '@/store/hooks'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { authenticated, initialized } = useAppSelector((state) => state.user)

  if (!initialized) {
    return <div className="route-loading"><Spin size="large" /></div>
  }
  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname, loginRequired: true }} />
  }
  return children
}
