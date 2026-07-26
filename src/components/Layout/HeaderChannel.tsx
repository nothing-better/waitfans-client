import { useEffect, useState } from 'react'
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

const fallback = [
  '番剧', '国创', '综艺', '动画', '鬼畜', '舞蹈', '娱乐', '科技数码',
  '美食', '汽车', '体育运动', '电影', '电视剧', '纪录片', '游戏', '音乐',
  '影视', '知识', '资讯', '小剧场', '时尚美妆', '更多',
]

export default function HeaderChannel() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 150)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className={`channel-row page-container ${compact ? 'channel-row--compact' : ''}`}>
      <div className="channel-shortcuts">
        <Link to="/message/dynamic">
          <span className="shortcut-icon shortcut-icon--dynamic"><RadiusSettingOutlined /></span>
          动态
        </Link>
        <Link to="/search/video?keyword=热门">
          <span className="shortcut-icon shortcut-icon--popular"><FireFilled /></span>
          热门
        </Link>
      </div>
      <div className="channel-grid">
        {fallback.map((label) => (
          <Link key={label} to={`/search/video?keyword=${encodeURIComponent(label)}`}>
            {label}
          </Link>
        ))}
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
