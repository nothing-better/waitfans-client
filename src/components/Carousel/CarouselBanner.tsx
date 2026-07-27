import { Carousel } from 'antd'
import { Link } from 'react-router-dom'
import type { VideoFeedItem } from '@/types/video'
const fallbackCover = '/assets/bilibili-home/25730189dbdc345f.avif'

interface CarouselBannerProps {
  items: VideoFeedItem[]
}

export default function CarouselBanner({ items }: CarouselBannerProps) {
  return (
    <div className="hero-carousel">
      <Carousel autoplay autoplaySpeed={5000} arrows>
        {items.map(({ video }) => (
          <Link key={video.vid} to={`/video/${video.vid}`} className="hero-carousel__slide">
            <img
              src={video.coverUrl || video.cover || fallbackCover}
              alt={video.title}
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = fallbackCover
              }}
            />
            <div className="hero-carousel__caption">
              <strong>{video.title}</strong>
            </div>
          </Link>
        ))}
      </Carousel>
    </div>
  )
}
