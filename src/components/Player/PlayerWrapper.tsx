import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'

interface PlayerWrapperProps {
  src?: string
  poster?: string
  title: string
  onTimeUpdate?: (time: number) => void
  onPlay?: () => void
}

export default function PlayerWrapper({
  src,
  poster,
  title,
  onTimeUpdate,
  onPlay,
}: PlayerWrapperProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const timeUpdateRef = useRef(onTimeUpdate)
  const playRef = useRef(onPlay)
  const titleRef = useRef(title)
  const playedSourceRef = useRef('')

  useEffect(() => {
    timeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])

  useEffect(() => {
    playRef.current = onPlay
  }, [onPlay])

  useEffect(() => {
    titleRef.current = title
    playerRef.current?.el().setAttribute('aria-label', title)
  }, [title])

  useEffect(() => {
    const container = playerContainerRef.current
    if (!container) return

    const videoElement = document.createElement('video-js')
    videoElement.classList.add('video-js', 'vjs-big-play-centered')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('aria-label', titleRef.current)
    container.appendChild(videoElement)

    const player = videojs(videoElement, {
      controls: true,
      fluid: true,
      preload: 'auto',
      sources: [],
    })
    const handleTime = () => timeUpdateRef.current?.(Number(player.currentTime() || 0))
    const handlePlay = () => {
      if (!playedSourceRef.current) {
        playedSourceRef.current = String(player.currentSrc() || 'playing')
        playRef.current?.()
      }
    }
    player.on('timeupdate', handleTime)
    player.on('play', handlePlay)
    playerRef.current = player
    return () => {
      player.off('timeupdate', handleTime)
      player.off('play', handlePlay)
      player.dispose()
      videoElement.remove()
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    playedSourceRef.current = ''
    player.src(src ? { src, type: 'video/mp4' } : [])
    player.poster(poster || '')
  }, [poster, src])

  return (
    <div className="player-shell">
      <div data-vjs-player ref={playerContainerRef} />
      {!src ? <div className="player-empty">视频资源暂不可用</div> : null}
    </div>
  )
}
