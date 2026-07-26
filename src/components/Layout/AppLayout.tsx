import { Outlet } from 'react-router-dom'
import HeaderBar from './HeaderBar'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <HeaderBar />
      <Outlet />
    </div>
  )
}
