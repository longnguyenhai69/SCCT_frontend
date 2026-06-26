import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { ROLE_LABEL, isTechRole, isManagerRole, initials } from '../utils'

const TABS = {
  tech: [
    { to: 'my-devices', label: 'Thiết bị của tôi', icon: '🖥' },
    { to: 'issues',     label: 'Sự cố',            icon: '🔧' },
    { to: 'history',    label: 'Lịch sử',           icon: '📋' },
    { to: 'monthly',    label: 'Báo cáo tháng',     icon: '📊' },
  ],
  manager: [
    { to: 'overview',  label: 'Tổng quan',    icon: '📈' },
    { to: 'sites',     label: 'Công trường',  icon: '🏗' },
    { to: 'mdevices',  label: 'Thiết bị',     icon: '🖥' },
    { to: 'mtickets',  label: 'Sự cố',        icon: '🔧' },
    { to: 'mreports',  label: 'BC Nhân viên', icon: '📊' },
  ],
  director: [
    { to: 'dashboard', label: 'Dashboard', icon: '📈' },
    { to: 'dtickets',  label: 'Sự cố',     icon: '🔧' },
  ],
  admin: [
    { to: 'accounts', label: 'Quản lý tài khoản', icon: '👥' },
  ],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const roleKey = isTechRole(user.role) ? 'tech'
    : isManagerRole(user.role)          ? 'manager'
    : user.role

  const tabs = TABS[roleKey] || []

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div id="app-shell">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon">SC</div>
          <div>
            <div className="sb-logo-text">SCCT</div>
            <div className="sb-logo-sub">Quản lý cơ điện</div>
          </div>
        </div>

        <nav className="sb-nav">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={`/app/${t.to}`}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-avatar">{initials(user.name)}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sb-user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
            <div className="sb-user-role">{ROLE_LABEL[user.role] || user.role}</div>
          </div>
          <button className="sb-logout" title="Đăng xuất" onClick={handleLogout}>⎋</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
