import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Empty, Skeleton, Tag, message } from 'antd'
import {
  DislikeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import { getDanmuList } from '@/api/comment'
import { getCumulativeVideos, getVideoDetail, toggleVideoLove } from '@/api/video'
import PlayerWrapper from '@/components/Player/PlayerWrapper'
import DanmuOverlay from '@/components/Danmu/DanmuOverlay'
import DanmuBox from '@/components/Danmu/DanmuBox'
import CommentTree from '@/components/Comment/CommentTree'
import VideoCard from '@/components/VideoCard/VideoCard'
import { useAppSelector } from '@/store/hooks'
import { useDanmuChannel } from '@/hooks/useDanmuChannel'
import { handleDate, handleNum } from '@/utils/format'
import type { Danmu } from '@/types/danmu'
import type { VideoDetailData, VideoFeedItem } from '@/types/video'

export default function VideoDetailPage() {
  const { vid = '' } = useParams()
  const authenticated = useAppSelector((state) => state.user.authenticated)
  const [detail, setDetail] = useState<VideoDetailData | null>(null)
  const [recommendations, setRecommendations] = useState<VideoFeedItem[]>([])
  const [danmu, setDanmu] = useState<Danmu[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const receiveDanmu = (item: Danmu) => {
    setDanmu((current) => {
      if (item.id && current.some((existing) => existing.id === item.id)) return current
      return [...current, item]
    })
  }
  const { connected: danmuConnected, send: sendDanmuMessage } = useDanmuChannel(vid, receiveDanmu)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(false)
    Promise.all([
      getVideoDetail(vid),
      getCumulativeVideos([vid]).catch(() => ({ videos: [], vids: [], more: false })),
      getDanmuList(vid).catch(() => []),
    ]).then(([nextDetail, recommended, nextDanmu]) => {
      if (!active) return
      setDetail(nextDetail)
      setRecommendations(recommended.videos || [])
      setDanmu(nextDanmu || [])
    }).catch(() => {
      if (active) {
        setDetail(null)
        setLoadError(true)
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [vid])

  const tags = useMemo(
    () => detail?.video.tags?.split(/\r?\n/).filter(Boolean) || [],
    [detail?.video.tags],
  )

  if (loading) {
    return (
      <main className="surface-page">
        <div className="page-container surface-panel video-missing"><Skeleton active /></div>
      </main>
    )
  }

  if (!detail) {
    return (
      <main className="surface-page">
        <div className="page-container surface-panel video-missing">
          <Empty description={loadError ? '视频不存在或暂时无法加载' : '视频不存在'} />
        </div>
      </main>
    )
  }

  const interact = async (love: boolean) => {
    if (!authenticated) {
      message.warning('请先登录')
      return
    }
    const data = new FormData()
    data.append('vid', String(detail.video.vid))
    data.append('isLove', String(love))
    data.append('isSet', String(love ? !liked : true))
    await toggleVideoLove(data)
    if (love) setLiked((value) => !value)
  }

  const sendDanmu = (content: string) => {
    if (!authenticated) {
      message.warning('请先登录')
      return false
    }
    if (!danmuConnected || !sendDanmuMessage(content, currentTime)) {
      message.error('弹幕服务尚未连接，请稍后重试')
      return false
    }
    return true
  }

  return (
    <main className="video-detail-page">
      <div className="video-detail-grid page-container">
        <section className="video-main">
          <h1>{detail.video.title}</h1>
          <div className="video-subtitle">
            <span>{handleNum(detail.stats.play)} 播放</span>
            <span>{handleNum(detail.stats.danmu)} 弹幕</span>
            <time>{detail.video.uploadDate ? handleDate(detail.video.uploadDate) : ''}</time>
          </div>
          <div className="player-stage">
            <PlayerWrapper
              src={detail.video.videoUrl}
              poster={detail.video.coverUrl || detail.video.cover}
              title={detail.video.title}
              onTimeUpdate={setCurrentTime}
            />
            <DanmuOverlay items={danmu} currentTime={currentTime} />
          </div>
          <div className="video-actions">
            <button className={liked ? 'active' : ''} type="button" onClick={() => interact(true)}>
              <LikeOutlined /> {handleNum((detail.stats.good || 0) + (liked ? 1 : 0))}
            </button>
            <button type="button" onClick={() => interact(false)}><DislikeOutlined /> 不喜欢</button>
            <button type="button"><StarOutlined /> {handleNum(detail.stats.collect || 0)}</button>
            <button type="button"><ShareAltOutlined /> {handleNum(detail.stats.share || 0)}</button>
          </div>
          <p className="video-description">{detail.video.descr || '这个视频还没有简介。'}</p>
          <div className="video-tags">{tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
          <CommentTree vid={detail.video.vid} />
        </section>
        <aside className="video-aside">
          <section className="author-card surface-panel">
            <Avatar size={52} src={detail.user.avatar_url || detail.user.avatar} icon={<UserOutlined />} />
            <div>
              <Link to={`/space/${detail.user.uid}`}>{detail.user.nickname}</Link>
              <p>{detail.user.description || '这个人很神秘，什么都没有写。'}</p>
            </div>
            <Button type="primary">+ 关注</Button>
          </section>
          <DanmuBox items={danmu} onSend={sendDanmu} />
          <section className="recommend-list">
            <h2>相关推荐</h2>
            {recommendations.slice(0, 8).map((item) => (
              <VideoCard key={item.video.vid} item={item} />
            ))}
          </section>
        </aside>
      </div>
    </main>
  )
}
