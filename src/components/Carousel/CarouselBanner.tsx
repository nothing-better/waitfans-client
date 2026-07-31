import { useCallback, useRef, useState } from "react";
import { Carousel } from "antd";
import type { CarouselRef } from "antd/es/carousel";
import { Link } from "react-router-dom";
import type { CarouselItem } from "@/types/video";

const fallbackCover = "/assets/bilibili-home/25730189dbdc345f.avif";

interface CarouselBannerProps {
  items: CarouselItem[];
}

export default function CarouselBanner({ items }: CarouselBannerProps) {
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const handleSlideChange = useCallback((_current: number, next: number) => {
    setActiveIndex(next);
  }, []);

  const goTo = useCallback((index: number) => {
    carouselRef.current?.goTo(index);
  }, []);

  const prevSlide = useCallback(() => {
    carouselRef.current?.prev();
  }, []);

  const nextSlide = useCallback(() => {
    carouselRef.current?.next();
  }, []);

  const current = items[activeIndex];
  const hasMultiple = items.length > 1;

  if (items.length === 0) {
    return (
      <div className="hero-carousel hero-carousel--empty">暂无轮播内容</div>
    );
  }

  return (
    <div className="carousel">
      <div className="hero-carousel" onMouseEnter={pause} onMouseLeave={resume}>
        {/* 图片滑动区 — 纯图片，无控件 */}
        <div className="hero-carousel__slider">
          <Carousel
            ref={carouselRef}
            autoplay={hasMultiple && !paused}
            autoplaySpeed={5000}
            arrows={false}
            dots={false}
            beforeChange={handleSlideChange}
          >
            {items.map((item) => (
              <Link
                key={item.id ?? `${item.target}-${item.url}`}
                className="hero-carousel__slide"
                to={item.target}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  loading="eager"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackCover;
                  }}
                />
              </Link>
            ))}
          </Carousel>
        </div>

        {/* 文字信息 + 控件区 */}
        {current && (
          <div className="hero-carousel__caption">
            {/* 第一行：标题 + 左右箭头 */}
            <div className="hero-carousel__caption-row">
              <Link className="hero-carousel__title" to={current.target}>
                {current.title}
              </Link>
              {hasMultiple && (
                <div className="hero-carousel__arrows">
                  <button
                    type="button"
                    className="hero-carousel__arrow hero-carousel__arrow--prev"
                    onClick={prevSlide}
                    aria-label="上一张"
                  />
                  <button
                    type="button"
                    className="hero-carousel__arrow hero-carousel__arrow--next"
                    onClick={nextSlide}
                    aria-label="下一张"
                  />
                </div>
              )}
            </div>

            {/* 第二行：dots 指示器 */}
            {hasMultiple && (
              <div className="hero-carousel__dots">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`hero-carousel__dot${i === activeIndex ? " hero-carousel__dot--active" : ""}`}
                    onClick={() => goTo(i)}
                    aria-label={`切换到第 ${i + 1} 张`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
