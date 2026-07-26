import { useEffect, useMemo, useState } from 'react'
import { Avatar, Empty, Skeleton, Tabs } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getFavorites, type Favorite } from '@/api/content'
import { getUserInfo } from '@/api/user'
import { getUserCollectedVideos, getUserLovedVideos, getUserWorks } from '@/api/video'
import VideoCard from '@/components/VideoCard/VideoCard'
import accountTop from '@/assets/img/account_top.png'
import { useAppSelector } from '@/store/hooks'
import { handleNum } from '@/utils/format'
import type { User } from '@/types/user'
import type { VideoFeedItem } from '@/types/video'

const tabItems = [
  ['home', '主页'],
  ['video', '投稿'],
  ['article', '专栏'],
  ['dynamic', '动态'],
  ['favlist', '收藏'],
  ['fans/follow', '关注'],
  ['fans/fans', '粉丝'],
] as const

export default function SpacePage() {
  const { uid = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentUser = useAppSelector((state) => state.user.current)
  const authenticated = useAppSelector((state) => state.user.authenticated)
  const [profile, setProfile] = useState<User | null>(null)
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const active = useMemo(() => {
    const suffix = location.pathname.replace(`/space/${uid}`, '').replace(/^\//, '')
    return suffix || 'home'
  }, [location.pathname, uid])

  useEffect(() => {
    let activeRequest = true
    setLoading(true)
    getUserInfo(uid)
      .then((value) => { if (activeRequest) setProfile(value) })
      .finally(() => { if (activeRequest) setLoading(false) })
    return () => { activeRequest = false }
  }, [uid])

  useEffect(() => {
    const ownSpace = Number(currentUser?.uid) === Number(uid)
    if (active === 'video' || active === 'home') {
      getUserWorks(uid).then((result) => setVideos(result?.list || [])).catch(() => setVideos([]))
    } else if (active === 'favlist') {
      const fid = searchParams.get('fid')
      if (fid) {
        getUserCollectedVideos(fid).then(setVideos).catch(() => setVideos([]))
      } else {
        getFavorites(uid, authenticated && ownSpace).then(setFavorites).catch(() => setFavorites([]))
      }
    } else if (active === 'dynamic') {
      getUserLovedVideos(uid).then(setVideos).catch(() => setVideos([]))
    }
  }, [active, authenticated, currentUser?.uid, searchParams, uid])

  if (loading) {
    return <main className="surface-page"><div className="page-container"><Skeleton active /></div></main>
  }

  if (!profile) {
    return <main className="surface-page"><Empty description="用户不存在" /></main>
  }

  return (
    <main className="surface-page space-page">
      <div className="space-shell page-container">
        <section className="space-header surface-panel" style={{ backgroundImage: `url(${accountTop})` }}>
          <Avatar size={88} src={profile.avatar_url || profile.avatar} icon={<UserOutlined />} />
          <div>
            <h1>{profile.nickname}</h1>
            <p>{profile.description || '这个人很神秘，什么都没有写。'}</p>
            <span>{handleNum(profile.followCount || 0)} 关注</span>
            <span>{handleNum(profile.fansCount || 0)} 粉丝</span>
          </div>
        </section>
        <section className="space-content surface-panel">
          <Tabs
            activeKey={active}
            onChange={(key) => navigate(`/space/${uid}/${key === 'home' ? '' : key}`)}
            items={tabItems.map(([key, label]) => ({ key, label }))}
          />
          {(active === 'home' || active === 'video' || active === 'dynamic') ? (
            videos.length ? (
              <div className="space-video-grid">
                {videos.map((item) => <VideoCard key={item.video.vid} item={item} />)}
              </div>
            ) : <Empty description="这里还没有内容" />
          ) : null}
          {active === 'favlist' ? (
            favorites.length && !searchParams.get('fid') ? (
              <div className="favorite-grid">
                {favorites.map((favorite) => (
                  <button
                    key={favorite.fid}
                    type="button"
                    onClick={() => navigate(`/space/${uid}/favlist?fid=${favorite.fid}`)}
                  >
                    <div>{favorite.cover ? <img src={favorite.cover} alt="" /> : '收藏夹'}</div>
                    <strong>{favorite.title}</strong>
                    <span>{favorite.count || 0} 个内容</span>
                  </button>
                ))}
              </div>
            ) : videos.length ? (
              <div className="space-video-grid">
                {videos.map((item) => <VideoCard key={item.video.vid} item={item} />)}
              </div>
            ) : <Empty description="收藏夹是空的" />
          ) : null}
          {['article', 'fans/follow', 'fans/fans', 'setting'].includes(active) ? (
            <Empty description="该模块已迁入 React，等待后端数据接入" />
          ) : null}
        </section>
      </div>
    </main>
  )
}
