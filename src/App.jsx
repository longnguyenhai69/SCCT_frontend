import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { isTechRole, isManagerRole } from './utils'
import Login    from './pages/Login'
import Layout   from './components/Layout'
import MyDevices from './pages/tech/MyDevices'
import Issues    from './pages/tech/Issues'
import History   from './pages/tech/History'
import Monthly   from './pages/tech/Monthly'
import Overview  from './pages/manager/Overview'
import Sites     from './pages/manager/Sites'
import Devices   from './pages/manager/Devices'
import MTickets  from './pages/manager/Tickets'
import MReports  from './pages/manager/Reports'
import Dashboard from './pages/director/Dashboard'
import DTickets  from './pages/director/Tickets'
import Accounts  from './pages/admin/Accounts'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Đang tải...</div>
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>

  const firstTab = () => {
    if (isTechRole(user.role))    return '/app/my-devices'
    if (isManagerRole(user.role)) return '/app/overview'
    if (user.role === 'director') return '/app/dashboard'
    return '/app/accounts'
  }

  return (
    <Routes>
      <Route path="/app" element={<Layout />}>
        {/* Tech */}
        <Route path="my-devices" element={<MyDevices />} />
        <Route path="issues"     element={<Issues />} />
        <Route path="history"    element={<History />} />
        <Route path="monthly"    element={<Monthly />} />
        {/* Manager */}
        <Route path="overview"   element={<Overview />} />
        <Route path="sites"      element={<Sites />} />
        <Route path="mdevices"   element={<Devices />} />
        <Route path="mtickets"   element={<MTickets />} />
        <Route path="mreports"   element={<MReports />} />
        {/* Director */}
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="dtickets"   element={<DTickets />} />
        {/* Admin */}
        <Route path="accounts"   element={<Accounts />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*"      element={<Navigate to={firstTab()} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
