import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { isTechRole, isManagerRole } from '../utils'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      if (isTechRole(user.role))    navigate('/app/my-devices')
      else if (isManagerRole(user.role)) navigate('/app/overview')
      else if (user.role === 'director') navigate('/app/dashboard')
      else navigate('/app/accounts')
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại')
    } finally { setLoading(false) }
  }

  return (
    <div id="login-screen">
      <div className="login-box">
        <div className="login-logo">SC</div>
        <div className="login-title">SCCT Quản lý thiết bị</div>
        <div className="login-sub">Hệ thống quản lý thiết bị cơ điện</div>

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          {error && (
            <div className="alert-info" style={{ marginBottom: 14 }}>⚠ {error}</div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input
              className="form-ctrl" type="email" autoFocus
              placeholder="example@scct.vn"
              value={email} onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Mật khẩu</label>
            <input
              className="form-ctrl" type="password"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit" className="btn btn-primary"
            style={{ width:'100%', padding:12, fontSize:14 }}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'#94a3b8' }}>
            Mật khẩu mặc định: <b>scct@2026</b>
          </div>
        </form>
      </div>
    </div>
  )
}
