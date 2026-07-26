import { Carousel } from 'antd'
import { Link } from 'react-router-dom'
import carouselItems from '@/assets/json/carousel.json'
import type { CarouselItem } from '@/types/video'
const fallbackCover = '/assets/bilibili-home/25730189dbdc345f.avif'

export default function CarouselBanner() {
  return (
    <div className="hero-carousel">
      <Carousel autoplay autoplaySpeed={5000} arrows>
        {(carouselItems as CarouselItem[]).map((item) => (
          <Link key={item.url} to={item.target} className="hero-carousel__slide">
            <img
              src={item.url}
              alt={item.title}
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = fallbackCover
              }}
            />
            <div
              className="hero-carousel__caption"
              style={{ background: `linear-gradient(transparent, ${item.color})` }}
            >
              <strong>{item.title}</strong>
            </div>
          </Link>
        ))}
      </Carousel>
    </div>
  )
}
