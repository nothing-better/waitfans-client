import { Carousel } from 'antd'
import { Link } from 'react-router-dom'
import type { VideoFeedItem } from '@/types/video'
import fallbackData from '@/assets/json/carousel.json'
const fallbackCover = '/assets/bilibili-home/25730189dbdc345f.avif'

interface CarouselBannerProps {
  items: VideoFeedItem[]
}

export default function CarouselBanner({ items }: CarouselBannerProps) {
  const hasVideos = items.length > 0

  return (
    <div className="hero-carousel">
      <Carousel autoplay autoplaySpeed={5000} arrows>
        {hasVideos
          ? items.map(({ video }) => (
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
          ))
          : fallbackData.map((item) => (
            <Link key={item.target} to={item.target} className="hero-carousel__slide">
              <img
                src={item.url}
                alt={item.title}
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = fallbackCover
                }}
              />
              <div className="hero-carousel__caption" style={{ background: item.color }}>
                <strong>{item.title}</strong>
              </div>
            </Link>
          ))}
      </Carousel>
    </div>
  )
}
