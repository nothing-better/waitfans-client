import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getChannels, getHotSearch, type Channel } from '@/api/content'

interface ContentState {
  channels: Channel[]
  trendings: string[]
}

const initialState: ContentState = { channels: [], trendings: [] }

export const fetchContentNavigation = createAsyncThunk('content/navigation', async () => {
  const [channels, trendings] = await Promise.all([
    getChannels().catch(() => []),
    getHotSearch().catch(() => []),
  ])
  return { channels, trendings }
})

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchContentNavigation.fulfilled, (state, action) => {
      state.channels = action.payload.channels
      state.trendings = action.payload.trendings
    })
  },
})

export default contentSlice.reducer
