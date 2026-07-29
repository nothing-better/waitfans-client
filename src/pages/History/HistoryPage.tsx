import { useCallback, useEffect, useState } from 'react'
import { Button, Empty, Skeleton } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { getUserPlayedVideos } from '@/api/video'
import VideoCard from '@/components/VideoCard/VideoCard'
import type { VideoFeedItem } from '@/types/video'

const PAGE_SIZE = 24

export default function HistoryPage() {
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    try {
      const offset = append ? videos.length : 0
      const result = await getUserPlayedVideos(offset, PAGE_SIZE)
      const next = result || []
      setVideos((current) => append ? [...current, ...next] : next)
      setHasMore(next.length === PAGE_SIZE)
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }, [videos.length])

  useEffect(() => {
    load()
    // 首屏只需要在页面挂载时获取，后续偏移量由“加载更多”显式触发。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="surface-page history-page">
      <section className="page-container surface-panel history-shell">
        <header className="page-heading">
          <div>
            <h1><ClockCircleOutlined /> 观看历史</h1>
            <p>这里展示账号最近播放过的视频，数据会在开始播放时自动同步。</p>
          </div>
          <span>{videos.length ? `已加载 ${videos.length} 条` : ''}</span>
        </header>
        {loading ? <Skeleton active paragraph={{ rows: 10 }} /> : null}
        {!loading && videos.length ? (
          <>
            <div className="history-video-grid">
              {videos.map((item) => <VideoCard key={item.video.vid} item={item} />)}
            </div>
            {hasMore ? (
              <Button className="history-load-more" loading={loadingMore} onClick={() => load(true)}>
                加载更多
              </Button>
            ) : <p className="history-end">已经看完全部历史记录</p>}
          </>
        ) : null}
        {!loading && !videos.length ? (
          <Empty description="还没有观看记录">
            <Button type="primary" href="/">去首页看看</Button>
          </Empty>
        ) : null}
      </section>
    </main>
  )
}
