import { Carousel } from 'antd'
import { Link } from 'react-router-dom'
import type { CarouselItem } from '@/types/video'
const fallbackCover = '/assets/bilibili-home/25730189dbdc345f.avif'

interface CarouselBannerProps {
  items: CarouselItem[]
}

export default function CarouselBanner({ items }: CarouselBannerProps) {
  return (
    <div className="hero-carousel">
      <Carousel autoplay autoplaySpeed={5000} arrows>
        {items.map((item) => (
          <Link key={item.id ?? `${item.target}-${item.url}`} to={item.target} className="hero-carousel__slide">
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
