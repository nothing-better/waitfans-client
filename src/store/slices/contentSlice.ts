import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getChannels, getHotSearch, type Channel } from '@/api/content'

interface ContentState {
  channels: Channel[]
  trendings: string[]
  channelsLoading: boolean
}

const initialState: ContentState = { channels: [], trendings: [], channelsLoading: true }

export const fetchContentNavigation = createAsyncThunk('content/navigation', async () => {
  const [channels, trendings] = await Promise.all([
    getChannels(),
    getHotSearch().catch(() => []),
  ])
  return { channels, trendings }
})

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContentNavigation.pending, (state) => {
        state.channelsLoading = true
      })
      .addCase(fetchContentNavigation.fulfilled, (state, action) => {
        state.channels = action.payload.channels
        state.trendings = action.payload.trendings
        state.channelsLoading = false
      })
      .addCase(fetchContentNavigation.rejected, (state) => {
        state.channelsLoading = false
      })
  },
})

export default contentSlice.reducer
