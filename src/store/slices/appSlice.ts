import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  isLoading: boolean
  openLogin: boolean
}

const initialState: AppState = {
  isLoading: false,
  openLogin: false,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setOpenLogin(state, action: PayloadAction<boolean>) {
      state.openLogin = action.payload
    },
  },
})

export const { setLoading, setOpenLogin } = appSlice.actions
export default appSlice.reducer
