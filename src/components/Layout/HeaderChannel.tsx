import { useEffect, useMemo, useState } from 'react'
import {
  BookOutlined,
  FireFilled,
  FlagOutlined,
  PlaySquareOutlined,
  RadiusSettingOutlined,
  ReadOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export default function HeaderChannel() {
  const [compact, setCompact] = useState(false)
  const channels = useAppSelector((state) => state.content.channels)
  const user = useAppSelector((state) => state.user.current)
  const channelLabels = useMemo(
    () => channels.flatMap((channel) => [
      channel.mcName,
      ...(channel.children || []).map((child) => child.scName),
    ]).filter(Boolean).slice(0, 22),
    [channels],
  )

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 150)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className={`channel-row page-container ${compact ? 'channel-row--compact' : ''}`}>
      <div className="channel-shortcuts">
        <Link to={user ? `/space/${user.uid}/dynamic` : '/search/video?keyword=动态'}>
          <span className="shortcut-icon shortcut-icon--dynamic"><RadiusSettingOutlined /></span>
          动态
        </Link>
        <Link to="/search/video?keyword=热门">
          <span className="shortcut-icon shortcut-icon--popular"><FireFilled /></span>
          热门
        </Link>
      </div>
      <div className="channel-grid">
        {channelLabels.map((label) => (
          <Link key={label} to={`/search/video?keyword=${encodeURIComponent(label)}`}>
            {label}
          </Link>
        ))}
        {channelLabels.length === 0 ? <span className="channel-grid__loading">分区加载中…</span> : null}
      </div>
      <div className="channel-extra">
        <Link to="/search/video?keyword=专栏"><ReadOutlined />专栏</Link>
        <Link to="/search/video?keyword=活动"><FlagOutlined />活动</Link>
        <Link to="/search/video?keyword=社区中心"><TeamOutlined />社区中心</Link>
        <Link to="/search/video?keyword=直播"><VideoCameraOutlined />直播</Link>
        <Link to="/search/video?keyword=课堂"><BookOutlined />课堂</Link>
        <Link to="/search/video?keyword=新歌热榜"><PlaySquareOutlined />新歌热榜</Link>
      </div>
    </div>
  )
}
