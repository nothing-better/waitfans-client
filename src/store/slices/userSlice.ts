import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as userApi from '@/api/user'
import { TOKEN_KEY } from '@/api/request'
import type { Credentials } from '@/api/user'
import type { User } from '@/types/user'

interface UserState {
  current: User | null
  authenticated: boolean
  initialized: boolean
}

const initialState: UserState = {
  current: null,
  authenticated: false,
  initialized: false,
}

export const fetchPersonalInfo = createAsyncThunk('user/fetchPersonalInfo', async () =>
  userApi.getPersonalInfo(),
)

export const loginUser = createAsyncThunk('user/login', async (credentials: Credentials) => {
  const payload = await userApi.login(credentials)
  localStorage.setItem(TOKEN_KEY, payload.token)
  return payload.user
})

export const logoutUser = createAsyncThunk('user/logout', async () => {
  await userApi.logout()
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearSession(state) {
      state.current = null
      state.authenticated = false
      state.initialized = true
    },
    updateCurrentUser(state, action: { payload: User }) {
      state.current = action.payload
      state.authenticated = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonalInfo.fulfilled, (state, action) => {
        state.current = action.payload
        state.authenticated = true
        state.initialized = true
      })
      .addCase(fetchPersonalInfo.rejected, (state) => {
        state.current = null
        state.authenticated = false
        state.initialized = true
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.current = action.payload
        state.authenticated = true
        state.initialized = true
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.current = null
        state.authenticated = false
      })
  },
})

export const { clearSession, updateCurrentUser } = userSlice.actions
export default userSlice.reducer
