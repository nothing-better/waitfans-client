import { useEffect } from 'react'
import AppRouter from '@/router'
import LoadingMask from '@/components/Layout/LoadingMask'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchContentNavigation } from '@/store/slices/contentSlice'
import { clearSession, fetchPersonalInfo } from '@/store/slices/userSlice'
import { connectIm, disconnectIm, fetchUnreadCounts } from '@/store/slices/messageSlice'
import { TOKEN_KEY } from '@/api/request'

function App() {
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector((state) => state.app.isLoading)
  const authenticated = useAppSelector((state) => state.user.authenticated)

  useEffect(() => {
    dispatch(fetchContentNavigation())
    if (localStorage.getItem(TOKEN_KEY)) {
      dispatch(fetchPersonalInfo())
    } else {
      dispatch(clearSession())
    }

    const handleExpired = () => dispatch(clearSession())
    window.addEventListener('waitfans:auth-expired', handleExpired)
    return () => window.removeEventListener('waitfans:auth-expired', handleExpired)
  }, [dispatch])

  useEffect(() => {
    if (!authenticated) return
    dispatch(fetchUnreadCounts())
    dispatch(connectIm())
    return () => {
      dispatch(disconnectIm())
    }
  }, [authenticated, dispatch])

  return (
    <>
      <AppRouter />
      <LoadingMask visible={isLoading} />
    </>
  )
}

export default App
