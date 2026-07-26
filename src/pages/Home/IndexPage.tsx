import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import HeaderChannel from '@/components/Layout/HeaderChannel'
import CarouselBanner from '@/components/Carousel/CarouselBanner'
import VideoCard from '@/components/VideoCard/VideoCard'
import { getCumulativeVideos, getRandomVideos } from '@/api/video'
import type { VideoFeedItem } from '@/types/video'

const HOME_ASSET_ROOT = '/assets/bilibili-home'

const fallbackSeeds = [
  ['0f80278b272db294.avif', '李达康注定腐败？他和高育良到底有什么区别？从大明王朝说起', '一条闲木鱼', 786000, 1350, 1780],
  ['194bc8a7f9e9fc3c.avif', '【老鼠人行动】和杨哥双人单三巅峰赛复建', '老飞宇66', 471000, 562, 265],
  ['3730659562a635dd.avif', '万税爷又出捞钱妙招，总统推文付费抢先看？', '麻薯波比呀', 811000, 1505, 922],
  ['9651e56372563ddf.avif', '碧蓝航线 2026港区盛夏清凉节·广州站 精彩回顾', '碧蓝航线', 34000, 30, 248],
  ['431f1ddd6a3d8ce8.avif', 'T9战术室世界杯终章｜全网最详决赛复盘解析', 'T9小赵', 140000, 1493, 2228],
  ['352da0725663e216.avif', '《人民的名义44》高育良为何走到沙瑞金楼下又离开？', '雍某', 721000, 1755, 1157],
  ['568d4d2e83065ad3.avif', '我从地狱归来', '杨齐家', 2123000, 10000, 891],
  ['e0e7fb6cb0cb6df9.avif', '因为淋过雨，想给高二学弟学妹们一些真心建议', '唐有语文急救包', 825000, 317, 612],
  ['856a8b604c505e47.avif', '鲁豫对话姜思达：带着「伤疤」奔跑的人', '陈鲁豫-慢谈', 7197000, 53000, 12945],
  ['322c62407dddf138.avif', '去新疆阿勒泰，来一次漫无目的的旅行', '赖导AboutLai', 1826000, 13000, 4133],
  ['33e4812a979891c9.avif', '十四郎兵临汤谷，大战一触即发', '哔哩哔哩国创', 966000, 884, 1476],
  ['371cadd4ec071563.avif', '和张圣叹一起聊聊暑假', '自制日报', 687000, 2295, 1522],
  ['53557e1f70f25688.avif', '当我们变成「双马尾小精灵」入侵小屋？！', '大炒面制造者Cen', 1300000, 5634, 1500],
  ['5caf4f362292cf31.avif', '硬核小作坊：你真的了解记忆的原理吗？', '硬核小作坊', 934000, 882, 966],
  ['958f4a15f618892d.avif', '清扫“凶宅”会遇到什么…？', '一只浅浅耶', 190200, 841, 1118],
  ['e2e0d8b3366e1763.avif', '寻找下一位影视新星！', '影视飓风', 589000, 1380, 734],
] as const

const fallbackVideos: VideoFeedItem[] = fallbackSeeds.map((item, index) => ({
  video: {
    vid: `demo-${index + 1}`,
    title: item[1],
    coverUrl: `${HOME_ASSET_ROOT}/${item[0]}`,
    duration: item[5],
    uploadDate: new Date(Date.now() - index * 86_400_000).toISOString(),
  },
  user: {
    uid: index + 1,
    nickname: item[2],
    username: `demo${index}`,
    exp: 1200,
  },
  stats: { play: item[3], danmu: item[4] },
}))

export default function IndexPage() {
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [excludedIds, setExcludedIds] = useState<Array<number | string>>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(true)
  const loadMarker = useRef<HTMLDivElement>(null)
  const fallbackOffset = useRef(0)

  const loadRandom = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getRandomVideos()
      if (result?.length >= 6) {
        setVideos(result)
        setExcludedIds(result.map((item) => item.video.vid))
        setMore(true)
      } else {
        setVideos(fallbackVideos)
        setMore(false)
      }
    } catch {
      const offset = fallbackOffset.current % fallbackVideos.length
      fallbackOffset.current += 3
      setVideos([...fallbackVideos.slice(offset), ...fallbackVideos.slice(0, offset)])
      setMore(false)
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
      setExcludedIds((current) => [...current, ...(result.vids || [])])
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

  const visibleVideos = useMemo(
    () => (videos.length ? videos : fallbackVideos),
    [videos],
  )

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
      <section className="feed-layout page-container">
        <CarouselBanner />
        {visibleVideos.slice(0, 6).map((item) => (
          <VideoCard key={item.video.vid} item={item} />
        ))}
        <button className="refresh-feed" type="button" onClick={loadRandom}>
          <ReloadOutlined /> 换一换
        </button>
        {visibleVideos.slice(6).map((item, index) => (
          <VideoCard key={`${item.video.vid}-${index}`} item={item} />
        ))}
      </section>
      <div ref={loadMarker} className="feed-marker" aria-live="polite">
        {loading ? '正在加载更多内容…' : more ? '继续浏览，发现更多' : '已经到底啦'}
      </div>
    </main>
  )
}
