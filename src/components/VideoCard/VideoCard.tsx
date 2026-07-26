import { Link } from 'react-router-dom'
import { MessageOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { handleDate, handleNum, handleTime } from '@/utils/format'
import type { VideoFeedItem } from '@/types/video'
import fallbackCover from '@/assets/img/bilibili/bilibili-winter-view-2.jpg'

interface VideoCardProps {
  item: VideoFeedItem
}

export default function VideoCard({ item }: VideoCardProps) {
  const { video, user, stats } = item
  return (
    <article className="video-card">
      <Link className="video-card__cover" to={`/video/${video.vid}`}>
        <img
          src={video.coverUrl || video.cover || fallbackCover}
          alt={video.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = fallbackCover
          }}
        />
        <div className="video-card__stats">
          <span><PlayCircleOutlined /> {handleNum(stats.play || 0)}</span>
          <span><MessageOutlined /> {handleNum(stats.danmu || 0)}</span>
          <b>{handleTime(video.duration || 0)}</b>
        </div>
      </Link>
      <h3 className="line-clamp-2"><Link to={`/video/${video.vid}`}>{video.title}</Link></h3>
      <p>
        <Link to={`/space/${user.uid}`}>UP {user.nickname}</Link>
        <span> · {video.uploadDate ? handleDate(video.uploadDate) : '最近'}</span>
      </p>
    </article>
  )
}
