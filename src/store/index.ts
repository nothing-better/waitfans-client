import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import userReducer from './slices/userSlice'
import contentReducer from './slices/contentSlice'
import messageReducer from './slices/messageSlice'
import { websocketMiddleware } from './middleware/websocket'

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    content: contentReducer,
    message: messageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(websocketMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
