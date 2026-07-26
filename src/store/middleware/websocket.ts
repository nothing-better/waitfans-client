import type { Middleware } from '@reduxjs/toolkit'
import { TOKEN_KEY } from '@/api/request'
import {
  connectIm,
  disconnectIm,
  sendIm,
  wsConnected,
  wsMessageReceived,
} from '@/store/slices/messageSlice'

export const websocketMiddleware: Middleware = (store) => {
  let socket: WebSocket | null = null

  return (next) => (action) => {
    if (connectIm.match(action)) {
      socket?.close()
      const base = import.meta.env.VITE_WS_IM_URL || 'ws://localhost:7071'
      socket = new WebSocket(`${base.replace(/\/$/, '')}/im`)
      socket.addEventListener('open', () => {
        store.dispatch(wsConnected())
        socket?.send(
          JSON.stringify({
            code: 100,
            content: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}`,
          }),
        )
      })
      socket.addEventListener('message', (event) => {
        try {
          store.dispatch(wsMessageReceived(JSON.parse(event.data)))
        } catch {
          // Ignore malformed frames and keep the connection alive.
        }
      })
    }

    if (disconnectIm.match(action)) {
      socket?.close()
      socket = null
    }

    if (sendIm.match(action) && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action.payload))
    }

    return next(action)
  }
}
