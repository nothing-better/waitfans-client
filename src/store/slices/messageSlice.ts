import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getUnreadCounts, type UnreadCounts } from '@/api/message'

const emptyUnread: UnreadCounts = {
  reply: 0,
  at: 0,
  love: 0,
  system: 0,
  whisper: 0,
  dynamic: 0,
}

interface MessageState {
  unread: UnreadCounts
  connected: boolean
}

export const fetchUnreadCounts = createAsyncThunk('message/unread', getUnreadCounts)

const messageSlice = createSlice({
  name: 'message',
  initialState: { unread: emptyUnread, connected: false } as MessageState,
  reducers: {
    connectIm() {},
    sendIm(_state, _action: PayloadAction<Record<string, unknown>>) {},
    disconnectIm(state) {
      state.connected = false
    },
    wsConnected(state) {
      state.connected = true
    },
    wsMessageReceived(state, action: PayloadAction<Record<string, unknown>>) {
      const type = action.payload.type as keyof UnreadCounts
      const content = action.payload.data as { type?: string } | undefined
      if (!(type in state.unread)) return
      if (content?.type === '全部已读') state.unread[type] = 0
      if (content?.type === '接收') state.unread[type] += 1
    },
    clearUnreadLocal(state, action: PayloadAction<keyof UnreadCounts>) {
      state.unread[action.payload] = 0
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnreadCounts.fulfilled, (state, action) => {
      state.unread = action.payload
    })
  },
})

export const {
  connectIm,
  sendIm,
  disconnectIm,
  wsConnected,
  wsMessageReceived,
  clearUnreadLocal,
} = messageSlice.actions
export default messageSlice.reducer
