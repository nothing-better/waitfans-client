import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Empty, Popconfirm, Segmented, Skeleton, Tag, message } from 'antd'
import { DeleteOutlined, PlayCircleOutlined, StarOutlined } from '@ant-design/icons'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cancelVideoCollection, getFavorites, type Favorite } from '@/api/content'
import { getUserCollectedVideos } from '@/api/video'
import VideoCard from '@/components/VideoCard/VideoCard'
import { useAppSelector } from '@/store/hooks'
import type { VideoFeedItem } from '@/types/video'

export default function FavoriteDetailPage() {
  const { uid = '', fid = '' } = useParams()
  const navigate = useNavigate()
  const currentUser = useAppSelector((state) => state.user.current)
  const authenticated = useAppSelector((state) => state.user.authenticated)
  const own = authenticated && Number(currentUser?.uid) === Number(uid)
  const [favorite, setFavorite] = useState<Favorite | null>(null)
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [rule, setRule] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [folders, nextVideos] = await Promise.all([
        getFavorites(uid, own),
        getUserCollectedVideos(fid, 1, rule, 100),
      ])
      setFavorite((folders || []).find((item) => String(item.fid) === String(fid)) || null)
      setVideos(nextVideos || [])
    } finally {
      setLoading(false)
    }
  }, [fid, own, rule, uid])

  useEffect(() => { load() }, [load])

  const firstVideo = useMemo(() => videos[0]?.video.vid, [videos])

  const removeVideo = async (vid: number | string) => {
    await cancelVideoCollection(vid, fid)
    setVideos((current) => current.filter((item) => String(item.video.vid) !== String(vid)))
    setFavorite((current) => current ? { ...current, count: Math.max(0, Number(current.count || 0) - 1) } : current)
    message.success('已从收藏夹移除')
  }

  return (
    <main className="surface-page favorite-detail-page">
      <section className="page-container surface-panel favorite-detail-shell">
        <div className="favorite-breadcrumb">
          <Link to={`/space/${uid}/favlist`}>收藏夹</Link><span>/</span><em>{favorite?.title || '详情'}</em>
        </div>
        <header className="favorite-detail-heading">
          <div className="favorite-detail-cover">
            {favorite?.cover ? <img src={favorite.cover} alt="" /> : <StarOutlined />}
          </div>
          <div>
            <h1>{favorite?.title || (loading ? '正在加载收藏夹' : '收藏夹不可见')}</h1>
            <p>{favorite?.description || '这个收藏夹还没有简介。'}</p>
            <span>{favorite?.count ?? videos.length} 个视频</span>
            {favorite?.visible === 0 ? <Tag>私密</Tag> : <Tag color="blue">公开</Tag>}
          </div>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!firstVideo}
            onClick={() => firstVideo && navigate(`/video/${firstVideo}`)}
          >
            播放全部
          </Button>
        </header>
        <div className="favorite-toolbar">
          <h2>收藏内容</h2>
          <Segmented
            value={rule}
            onChange={(value) => setRule(Number(value) as 1 | 2 | 3)}
            options={[
              { value: 1, label: '最近收藏' },
              { value: 2, label: '最多播放' },
              { value: 3, label: '最新投稿' },
            ]}
          />
        </div>
        {loading ? <Skeleton active paragraph={{ rows: 10 }} /> : null}
        {!loading && favorite && videos.length ? (
          <div className="favorite-video-grid">
            {videos.map((item) => (
              <div className="favorite-video-item" key={item.video.vid}>
                <VideoCard item={item} />
                {own ? (
                  <Popconfirm title="从这个收藏夹移除？" onConfirm={() => removeVideo(item.video.vid)}>
                    <Button danger size="small" icon={<DeleteOutlined />}>移除</Button>
                  </Popconfirm>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {!loading && favorite && !videos.length ? <Empty description="收藏夹是空的" /> : null}
        {!loading && !favorite ? <Empty description="收藏夹不存在、已隐藏或无权访问" /> : null}
      </section>
    </main>
  )
}
