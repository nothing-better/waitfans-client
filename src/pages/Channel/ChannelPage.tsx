import { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Skeleton, Tag } from 'antd'
import { AppstoreOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import { searchVideos } from '@/api/content'
import VideoCard from '@/components/VideoCard/VideoCard'
import { useAppSelector } from '@/store/hooks'
import type { VideoFeedItem } from '@/types/video'

export default function ChannelPage() {
  const { mcId = '', scId = '' } = useParams()
  const channels = useAppSelector((state) => state.content.channels)
  const channelsLoading = useAppSelector((state) => state.content.channelsLoading)
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  const selection = useMemo(() => {
    const main = channels.find((item) => String(item.mcId) === String(mcId))
    const child = main?.children?.find((item) => String(item.scId) === String(scId))
    return { main, child }
  }, [channels, mcId, scId])

  const keyword = selection.child?.scName || selection.main?.mcName || ''

  useEffect(() => {
    if (channelsLoading || !keyword) {
      if (!channelsLoading) setLoading(false)
      return
    }
    setLoading(true)
    setPage(1)
    searchVideos(keyword, 1)
      .then((result) => {
        const next = result || []
        setVideos(next)
        setHasMore(next.length >= 10)
      })
      .catch(() => {
        setVideos([])
        setHasMore(false)
      })
      .finally(() => setLoading(false))
  }, [channelsLoading, keyword])

  const loadMore = async () => {
    const nextPage = page + 1
    setLoading(true)
    try {
      const result = await searchVideos(keyword, nextPage)
      const next = result || []
      setVideos((current) => [...current, ...next])
      setPage(nextPage)
      setHasMore(next.length >= 10)
    } finally {
      setLoading(false)
    }
  }

  if (!channelsLoading && !selection.main) {
    return <main className="surface-page"><Empty description="分区不存在" /></main>
  }

  return (
    <main className="surface-page channel-page">
      <section className="page-container">
        <header className="channel-heading surface-panel">
          <div className="channel-heading__icon"><AppstoreOutlined /></div>
          <div>
            <p>{selection.main?.mcName || '内容分区'}</p>
            <h1>{selection.child?.scName || selection.main?.mcName || '加载中'}</h1>
            <span>{selection.child ? `浏览 ${selection.main?.mcName} 分区下的精选内容` : '发现这个分区里的热门内容'}</span>
          </div>
        </header>
        {selection.main?.children?.length ? (
          <nav className="channel-subnav" aria-label="二级分区">
            <Link className={!scId ? 'active' : ''} to={`/channel/${selection.main.mcId}`}>全部</Link>
            {selection.main.children.map((child) => (
              <Link
                key={child.scId}
                className={String(child.scId) === String(scId) ? 'active' : ''}
                to={`/channel/${selection.main?.mcId}/${child.scId}`}
              >
                {child.scName}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="channel-result-heading">
          <h2>分区视频</h2>
          {keyword ? <Tag color="blue">{keyword}</Tag> : null}
        </div>
        {loading && videos.length === 0 ? <Skeleton active paragraph={{ rows: 10 }} /> : null}
        {videos.length ? (
          <div className="channel-video-grid">
            {videos.map((item) => <VideoCard key={`${item.video.vid}-${item.video.uploadDate || ''}`} item={item} />)}
          </div>
        ) : null}
        {!loading && !videos.length ? <Empty description="这个分区暂时没有已过审的视频" /> : null}
        {hasMore ? (
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadMore}>加载更多</Button>
        ) : null}
      </section>
    </main>
  )
}
