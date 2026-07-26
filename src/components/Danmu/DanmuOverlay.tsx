import { useEffect, useRef } from 'react'
import type { Danmu } from '@/types/danmu'

interface DanmuOverlayProps {
  items: Danmu[]
  currentTime: number
}

function danmuTime(item: Danmu) {
  return Number(item.timePoint ?? item.time ?? 0)
}

export default function DanmuOverlay({ items, currentTime }: DanmuOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ratio = window.devicePixelRatio || 1
    const width = canvas.width / ratio
    const height = canvas.height / ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.font = '600 20px "HarmonyOS Sans SC", sans-serif'
    context.shadowColor = 'rgba(0,0,0,.75)'
    context.shadowBlur = 3

    items.forEach((item, index) => {
      const elapsed = currentTime - danmuTime(item)
      if (elapsed < 0 || elapsed > 8) return
      const textWidth = context.measureText(item.content).width
      const x = width - (elapsed / 8) * (width + textWidth)
      const laneCount = Math.max(1, Math.floor((height - 44) / 32))
      const y = 32 + (index % laneCount) * 32
      context.fillStyle =
        typeof item.color === 'string' && item.color ? item.color : '#ffffff'
      context.fillText(item.content, x, y)
    })
  }, [currentTime, items])

  return <canvas ref={canvasRef} className="danmu-overlay" aria-hidden="true" />
}
