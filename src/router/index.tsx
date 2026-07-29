import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import AppLayout from '@/components/Layout/AppLayout'
import RequireAuth from './guards'

const IndexPage = lazy(() => import('@/pages/Home/IndexPage'))
const VideoDetailPage = lazy(() => import('@/pages/VideoDetail/VideoDetailPage'))
const SearchPage = lazy(() => import('@/pages/Search/SearchPage'))
const SpacePage = lazy(() => import('@/pages/Space/SpacePage'))
const FavoriteDetailPage = lazy(() => import('@/pages/Favorite/FavoriteDetailPage'))
const ChannelPage = lazy(() => import('@/pages/Channel/ChannelPage'))
const HistoryPage = lazy(() => import('@/pages/History/HistoryPage'))
const AccountPage = lazy(() => import('@/pages/Account/AccountPage'))
const PlatformPage = lazy(() => import('@/pages/Platform/PlatformPage'))
const MessagePage = lazy(() => import('@/pages/Message/MessagePage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function LazyLoad({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="route-loading"><Spin size="large" /></div>}>
      {children}
    </Suspense>
  )
}

function Protected({ children }: { children: ReactNode }) {
  return <RequireAuth><LazyLoad>{children}</LazyLoad></RequireAuth>
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LazyLoad><IndexPage /></LazyLoad>} />
        <Route path="video/:vid" element={<LazyLoad><VideoDetailPage /></LazyLoad>} />
        <Route path="search" element={<Navigate to="/search/video" replace />} />
        <Route path="search/:type" element={<LazyLoad><SearchPage /></LazyLoad>} />
        <Route path="channel/:mcId/:scId?" element={<LazyLoad><ChannelPage /></LazyLoad>} />
        <Route path="space/:uid/favorite/:fid" element={<LazyLoad><FavoriteDetailPage /></LazyLoad>} />
        <Route path="space/:uid/*" element={<LazyLoad><SpacePage /></LazyLoad>} />
        <Route path="history" element={<Protected><HistoryPage /></Protected>} />
        <Route path="account/*" element={<Protected><AccountPage /></Protected>} />
        <Route path="platform/*" element={<Protected><PlatformPage /></Protected>} />
        <Route path="message/*" element={<Protected><MessagePage /></Protected>} />
        <Route path="*" element={<LazyLoad><NotFound /></LazyLoad>} />
      </Route>
    </Routes>
  )
}
