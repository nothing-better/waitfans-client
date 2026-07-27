import { useCallback, useEffect, useRef, useState } from 'react'
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Empty } from 'antd'
import HeaderChannel from '@/components/Layout/HeaderChannel'
import CarouselBanner from '@/components/Carousel/CarouselBanner'
import VideoCard from '@/components/VideoCard/VideoCard'
import { getCumulativeVideos, getRandomVideos } from '@/api/video'
import type { VideoFeedItem } from '@/types/video'

const HOME_ASSET_ROOT = '/assets/bilibili-home'

export default function IndexPage() {
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [excludedIds, setExcludedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(true)
  const [error, setError] = useState('')
  const loadMarker = useRef<HTMLDivElement>(null)

  const loadRandom = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getRandomVideos()
      const nextVideos = result || []
      setVideos(nextVideos)
      setExcludedIds(
        nextVideos
          .map((item) => Number(item.video.vid))
          .filter(Number.isFinite),
      )
      setMore(nextVideos.length > 0)
    } catch {
      setVideos([])
      setExcludedIds([])
      setMore(false)
      setError('暂时无法获取推荐内容，请检查后端服务后重试。')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !more) return
    setLoading(true)
    try {
      const result = await getCumulativeVideos(excludedIds)
      setVideos((current) => [...current, ...(result.videos || [])])
      setExcludedIds((current) => [...current, ...(result.vids || []).map(Number)])
      setMore(result.more)
    } catch {
      setMore(false)
    } finally {
      setLoading(false)
    }
  }, [excludedIds, loading, more])

  useEffect(() => { loadRandom() }, [loadRandom])

  useEffect(() => {
    const marker = loadMarker.current
    if (!marker) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videos.length > 0) loadMore()
      },
      { rootMargin: '500px' },
    )
    observer.observe(marker)
    return () => observer.disconnect()
  }, [loadMore, videos.length])

  return (
    <main className="home-page">
      <section className="home-hero" aria-label="首页主题头图">
        <img
          className="home-hero__background"
          src={`${HOME_ASSET_ROOT}/4152ad2dc02cb823.avif`}
          alt=""
        />
        <img
          className="home-hero__logo"
          src={`${HOME_ASSET_ROOT}/b8d75a5b12be6169.png`}
          alt="bilibili"
        />
      </section>
      <HeaderChannel />
      {error ? (
        <section className="home-state page-container">
          <WarningOutlined />
          <h2>推荐内容加载失败</h2>
          <p>{error}</p>
          <Button type="primary" onClick={loadRandom}>重新加载</Button>
        </section>
      ) : videos.length > 0 ? (
        <section className="feed-layout page-container">
          <CarouselBanner items={videos.slice(0, 5)} />
          {videos.slice(5, 11).map((item) => (
            <VideoCard key={item.video.vid} item={item} />
          ))}
          <button className="refresh-feed" type="button" onClick={loadRandom}>
            <ReloadOutlined /> 换一换
          </button>
          {videos.slice(11).map((item) => (
            <VideoCard key={item.video.vid} item={item} />
          ))}
        </section>
      ) : !loading ? (
        <section className="home-state page-container">
          <Empty description="还没有已过审的视频" />
          <Button type="primary" href="/platform/upload/video">发布第一个视频</Button>
        </section>
      ) : null}
      <div ref={loadMarker} className="feed-marker" aria-live="polite">
        {loading ? '正在加载更多内容…' : more ? '继续浏览，发现更多' : '已经到底啦'}
      </div>
    </main>
  )
}
