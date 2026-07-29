import { useCallback, useEffect, useRef, useState } from 'react'
import { TOKEN_KEY } from '@/api/request'
import type { Danmu } from '@/types/danmu'

export interface DanmuStyle {
  fontsize: 18 | 25
  mode: 1 | 2 | 3
  color: string
}

function danmuSocketUrl(vid: number | string) {
  const configured = import.meta.env.VITE_WS_DANMU_URL as string | undefined
  const base = configured
    ? configured.replace(/\/$/, '')
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  return `${base}/ws/danmu/${vid}`
}

export function useDanmuChannel(
  vid: number | string,
  onDanmu: (danmu: Danmu) => void,
) {
  const socketRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef(onDanmu)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    handlerRef.current = onDanmu
  }, [onDanmu])

  useEffect(() => {
    if (!vid) return
    const socket = new WebSocket(danmuSocketUrl(vid))
    socketRef.current = socket
    socket.addEventListener('open', () => setConnected(true))
    socket.addEventListener('close', () => setConnected(false))
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string' || !event.data.startsWith('{')) return
      try {
        handlerRef.current(JSON.parse(event.data) as Danmu)
      } catch {
        // 在线人数等文本帧不属于弹幕数据。
      }
    })
    return () => {
      socket.close()
      socketRef.current = null
      setConnected(false)
    }
  }, [vid])

  const send = useCallback((content: string, timePoint: number, style?: DanmuStyle) => {
    const socket = socketRef.current
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || socket?.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify({
      token: `Bearer ${token}`,
      vid: Number(vid),
      data: {
        content,
        fontsize: style?.fontsize ?? 25,
        mode: style?.mode ?? 1,
        color: style?.color ?? '#FFFFFF',
        timePoint,
      },
    }))
    return true
  }, [vid])

  return { connected, send }
}
