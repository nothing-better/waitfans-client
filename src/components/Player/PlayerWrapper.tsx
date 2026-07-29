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
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<Player | null>(null)
  const timeUpdateRef = useRef(onTimeUpdate)
  const playRef = useRef(onPlay)
  const playedSourceRef = useRef('')

  useEffect(() => {
    timeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])

  useEffect(() => {
    playRef.current = onPlay
  }, [onPlay])

  useEffect(() => {
    if (!videoRef.current) return
    const player = videojs(videoRef.current, {
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
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    playedSourceRef.current = ''
    if (src) player.src({ src })
    if (poster) player.poster(poster)
  }, [poster, src])

  return (
    <div className="player-shell">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
        aria-label={title}
      />
      {!src ? <div className="player-empty">视频资源暂不可用</div> : null}
    </div>
  )
}
