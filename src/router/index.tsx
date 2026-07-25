import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Spin } from 'antd'
import AppLayout from '@/components/Layout/AppLayout'

const IndexPage = lazy(() => import('@/pages/Home/IndexPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Spin className="flex justify-center items-center min-h-screen" />}>
    {children}
  </Suspense>
)

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LazyLoad><IndexPage /></LazyLoad>} />
        <Route path="*" element={<LazyLoad><NotFound /></LazyLoad>} />
      </Route>
    </Routes>
  )
}
