import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Empty, Skeleton, Statistic, Tabs } from 'antd'
import {
  HeartOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
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
  ['dynamic', '喜欢'],
  ['favlist', '收藏'],
] as const
const validTabs = new Set(tabItems.map(([key]) => key))

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
  const [contentLoading, setContentLoading] = useState(true)

  const active = useMemo(() => {
    const suffix = location.pathname.replace(`/space/${uid}`, '').replace(/^\//, '')
    return validTabs.has(suffix as typeof tabItems[number][0]) ? suffix : 'home'
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
    let activeRequest = true
    const ownSpace = Number(currentUser?.uid) === Number(uid)
    setContentLoading(true)
    setVideos([])
    setFavorites([])
    const finish = () => {
      if (activeRequest) setContentLoading(false)
    }
    if (active === 'video' || active === 'home') {
      getUserWorks(uid)
        .then((result) => { if (activeRequest) setVideos(result?.list || []) })
        .catch(() => { if (activeRequest) setVideos([]) })
        .finally(finish)
    } else if (active === 'favlist') {
      const fid = searchParams.get('fid')
      if (fid) {
        getUserCollectedVideos(fid)
          .then((result) => { if (activeRequest) setVideos(result) })
          .catch(() => { if (activeRequest) setVideos([]) })
          .finally(finish)
      } else {
        getFavorites(uid, authenticated && ownSpace)
          .then((result) => { if (activeRequest) setFavorites(result) })
          .catch(() => { if (activeRequest) setFavorites([]) })
          .finally(finish)
      }
    } else if (active === 'dynamic') {
      getUserLovedVideos(uid)
        .then((result) => { if (activeRequest) setVideos(result) })
        .catch(() => { if (activeRequest) setVideos([]) })
        .finally(finish)
    } else {
      finish()
    }
    return () => { activeRequest = false }
  }, [active, authenticated, currentUser?.uid, searchParams, uid])

  const totals = useMemo(
    () => videos.reduce(
      (result, item) => ({
        play: result.play + Number(item.stats.play || 0),
        danmu: result.danmu + Number(item.stats.danmu || 0),
        good: result.good + Number(item.stats.good || 0),
      }),
      { play: 0, danmu: 0, good: 0 },
    ),
    [videos],
  )

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
          <div className="space-header__profile">
            <h1>{profile.nickname}</h1>
            <p>{profile.description || '这个人很神秘，什么都没有写。'}</p>
            <span>{handleNum(profile.followCount || 0)} 关注</span>
            <span>{handleNum(profile.fansCount || 0)} 粉丝</span>
          </div>
          <div className="space-header__actions">
            {Number(currentUser?.uid) === Number(uid) ? (
              <Button onClick={() => navigate('/account/info')}>编辑资料</Button>
            ) : (
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={() => navigate(`/message/whisper/${uid}`)}
              >
                私信
              </Button>
            )}
          </div>
        </section>
        <section className="space-content surface-panel">
          <Tabs
            activeKey={active}
            onChange={(key) => navigate(`/space/${uid}/${key === 'home' ? '' : key}`)}
            items={tabItems.map(([key, label]) => ({ key, label }))}
          />
          {contentLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}
          {!contentLoading && active === 'home' ? (
            <>
              <div className="space-overview">
                <Statistic title="投稿" value={videos.length} prefix={<VideoCameraOutlined />} />
                <Statistic title="播放" value={totals.play} prefix={<PlayCircleOutlined />} />
                <Statistic title="弹幕" value={totals.danmu} prefix={<MessageOutlined />} />
                <Statistic title="获赞" value={totals.good} prefix={<HeartOutlined />} />
              </div>
              <h2 className="space-section-title">最近投稿</h2>
            </>
          ) : null}
          {!contentLoading && (active === 'home' || active === 'video' || active === 'dynamic') ? (
            videos.length ? (
              <div className="space-video-grid">
                {videos.map((item) => <VideoCard key={item.video.vid} item={item} />)}
              </div>
            ) : <Empty description="这里还没有内容" />
          ) : null}
          {!contentLoading && active === 'favlist' ? (
            favorites.length && !searchParams.get('fid') ? (
              <div className="favorite-grid">
                {favorites.map((favorite) => (
                  <button
                    key={favorite.fid}
                    type="button"
                    onClick={() => navigate(`/space/${uid}/favorite/${favorite.fid}`)}
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
        </section>
      </div>
    </main>
  )
}
