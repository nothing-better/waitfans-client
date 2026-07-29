import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Empty, Skeleton, Tag, message } from 'antd'
import {
  DislikeOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDanmu, getDanmuList } from '@/api/comment'
import {
  getCumulativeVideos,
  getVideoDetail,
  recordVideoPlay,
  toggleVideoLove,
} from '@/api/video'
import { createChat } from '@/api/message'
import PlayerWrapper from '@/components/Player/PlayerWrapper'
import DanmuOverlay from '@/components/Danmu/DanmuOverlay'
import DanmuBox from '@/components/Danmu/DanmuBox'
import CommentTree from '@/components/Comment/CommentTree'
import FavoriteSelector from '@/components/Favorite/FavoriteSelector'
import VideoCard from '@/components/VideoCard/VideoCard'
import { useAppSelector } from '@/store/hooks'
import { useDanmuChannel, type DanmuStyle } from '@/hooks/useDanmuChannel'
import { handleDate, handleNum } from '@/utils/format'
import type { Danmu } from '@/types/danmu'
import type { VideoDetailData, VideoFeedItem } from '@/types/video'

export default function VideoDetailPage() {
  const { vid = '' } = useParams()
  const navigate = useNavigate()
  const authenticated = useAppSelector((state) => state.user.authenticated)
  const currentUser = useAppSelector((state) => state.user.current)
  const [detail, setDetail] = useState<VideoDetailData | null>(null)
  const [recommendations, setRecommendations] = useState<VideoFeedItem[]>([])
  const [danmu, setDanmu] = useState<Danmu[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeDelta, setLikeDelta] = useState(0)
  const [disliked, setDisliked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [collectDelta, setCollectDelta] = useState(0)
  const [favoriteOpen, setFavoriteOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const receiveDanmu = useCallback((item: Danmu) => {
    setDanmu((current) => {
      if (item.id && current.some((existing) => existing.id === item.id)) return current
      return [...current, item]
    })
  }, [])
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
      setLiked(false)
      setLikeDelta(0)
      setDisliked(false)
      setCollected(false)
      setCollectDelta(0)
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
    data.append('isSet', String(love ? !liked : !disliked))
    const wasLiked = liked
    const next = await toggleVideoLove(data)
    const nextLiked = Boolean(next?.love)
    setLiked(nextLiked)
    setDisliked(Boolean(next?.unlove))
    if (nextLiked !== wasLiked) {
      setLikeDelta((current) => current + (nextLiked ? 1 : -1))
    }
  }

  const sendDanmu = (content: string, style: DanmuStyle) => {
    if (!authenticated) {
      message.warning('请先登录')
      return false
    }
    if (!danmuConnected || !sendDanmuMessage(content, currentTime, style)) {
      message.error('弹幕服务尚未连接，请稍后重试')
      return false
    }
    return true
  }

  const removeDanmu = async (item: Danmu) => {
    if (!item.id) return
    const data = new FormData()
    data.append('id', String(item.id))
    await deleteDanmu(data)
    setDanmu((current) => current.filter((entry) => entry.id !== item.id))
    message.success('弹幕已删除')
  }

  const handlePlay = () => {
    recordVideoPlay(detail.video.vid, authenticated)
      .then((interaction) => {
        if (!authenticated) return
        setLiked(Boolean(interaction?.love))
        setDisliked(Boolean(interaction?.unlove))
        setCollected(Boolean(interaction?.collect))
      })
      .catch(() => undefined)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: detail.video.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        message.success('视频链接已复制')
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      message.warning('暂时无法分享，请手动复制地址栏链接')
    }
  }

  const startChat = async () => {
    if (!authenticated) {
      message.warning('请先登录')
      return
    }
    await createChat(detail.user.uid).catch(() => undefined)
    navigate(`/message/whisper/${detail.user.uid}`)
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
              onPlay={handlePlay}
            />
            <DanmuOverlay items={danmu} currentTime={currentTime} />
          </div>
          <div className="video-actions">
            <button className={liked ? 'active' : ''} type="button" onClick={() => interact(true)}>
              <LikeOutlined /> {handleNum(Math.max(0, Number(detail.stats.good || 0) + likeDelta))}
            </button>
            <button className={disliked ? 'active' : ''} type="button" onClick={() => interact(false)}>
              <DislikeOutlined /> 不喜欢
            </button>
            <button
              className={collected ? 'active' : ''}
              type="button"
              onClick={() => {
                if (!authenticated) {
                  message.warning('请先登录')
                  return
                }
                setFavoriteOpen(true)
              }}
            >
              {collected ? <StarFilled /> : <StarOutlined />}
              {handleNum(Math.max(0, Number(detail.stats.collect || 0) + collectDelta))}
            </button>
            <button type="button" onClick={share}>
              <ShareAltOutlined /> {detail.stats.share ? handleNum(detail.stats.share) : '分享'}
            </button>
          </div>
          <p className="video-description">{detail.video.descr || '这个视频还没有简介。'}</p>
          {detail.category ? (
            <div className="video-category">
              <Link to={`/channel/${detail.category.mcId || detail.video.mcId || ''}`}>
                {detail.category.mcName}
              </Link>
              {detail.category.scName ? (
                <>
                  <span>/</span>
                  <Link
                    to={`/channel/${detail.category.mcId || detail.video.mcId || ''}/${detail.category.scId || detail.video.scId || ''}`}
                  >
                    {detail.category.scName}
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="video-tags">
            {tags.map((tag) => (
              <Link key={tag} to={`/search/video?keyword=${encodeURIComponent(tag)}`}>
                <Tag>{tag}</Tag>
              </Link>
            ))}
          </div>
          <CommentTree
            vid={detail.video.vid}
            ownerUid={detail.user.uid}
            total={detail.stats.comment}
          />
        </section>
        <aside className="video-aside">
          <section className="author-card surface-panel">
            <Avatar size={52} src={detail.user.avatar_url || detail.user.avatar} icon={<UserOutlined />} />
            <div>
              <Link to={`/space/${detail.user.uid}`}>{detail.user.nickname}</Link>
              <p>{detail.user.description || '这个人很神秘，什么都没有写。'}</p>
            </div>
            {Number(currentUser?.uid) !== Number(detail.user.uid) ? (
              <Button icon={<MessageOutlined />} onClick={startChat}>私信</Button>
            ) : null}
          </section>
          <DanmuBox
            items={danmu}
            onSend={sendDanmu}
            currentUid={currentUser?.uid}
            ownerUid={detail.user.uid}
            currentRole={currentUser?.role}
            onDelete={removeDanmu}
          />
          <section className="recommend-list">
            <h2>相关推荐</h2>
            {recommendations.slice(0, 8).map((item) => (
              <VideoCard key={item.video.vid} item={item} />
            ))}
          </section>
        </aside>
      </div>
      {currentUser?.uid ? (
        <FavoriteSelector
          open={favoriteOpen}
          uid={currentUser.uid}
          vid={detail.video.vid}
          onClose={() => setFavoriteOpen(false)}
          onSaved={(selectedCount) => {
            const nextCollected = selectedCount > 0
            setCollectDelta((current) => current + (nextCollected === collected ? 0 : nextCollected ? 1 : -1))
            setCollected(nextCollected)
          }}
        />
      ) : null}
    </main>
  )
}
