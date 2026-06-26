import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'
import Modal from '../../components/Modal'
import Alert, { useAlert } from '../../components/Alert'
import { ROLE_LABEL, initials } from '../../utils'
import api from '../../api'

const ROLES = [['tech','Nhân viên kỹ thuật'],['specialist','Chuyên viên cơ điện'],['deputy_manager','Phó phòng kỹ thuật cơ điện'],['manager','Trưởng phòng kỹ thuật'],['director','Phó Tổng Giám Đốc'],['admin','Quản trị hệ thống']]
const EMPTY = { name:'', email:'', role:'tech', password:'' }
const AVATAR_COLORS = ['#2563eb','#16a34a','#9333ea','#ea580c','#0891b2','#dc2626']
const avatarColor = (name) => AVATAR_COLORS[name?.charCodeAt(0) % AVATAR_COLORS.length] || '#64748b'

export default function Accounts() {
  const { user: me }          = useAuth()
  const [users,   setUsers]   = useState([])
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [changePw, setChangePw] = useState(false)
  const { alert, show, hide } = useAlert()

  const load = () => api.get('/users').then(r => setUsers(r.data))
  useEffect(load, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setChangePw(false); setModal(true) }
  const openEdit = (u) => { setEditing(u); setForm({ name:u.name, email:u.email, role:u.role, password:'' }); setChangePw(false); setModal(true) }

  async function handleSave() {
    if (!form.name || !form.email) { show('Họ tên và email là bắt buộc', 'info'); return }
    if (!editing && !form.password) { show('Mật khẩu là bắt buộc khi tạo tài khoản mới', 'info'); return }
    try {
      const data = { ...form }
      if (editing && !changePw) delete data.password
      if (!data.password) delete data.password
      editing ? await api.put(`/users/${editing.id}`, data) : await api.post('/users', data)
      show(editing ? 'Đã cập nhật tài khoản' : 'Đã tạo tài khoản mới', 'success')
      setModal(false); load()
    } catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  async function handleDelete(u) {
    if (u.id === me.id) { show('Không thể xóa chính mình', 'info'); return }
    if (!confirm(`Xóa tài khoản "${u.name}"?`)) return
    try { await api.delete(`/users/${u.id}`); load() }
    catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  const byRole = ROLES.map(([role, label]) => ({ role, label, users: users.filter(u => u.role === role) })).filter(g => g.users.length > 0)

  return (
    <div>
      <div className="page-title">Quản lý tài khoản</div>
      <div className="page-sub">{users.length} tài khoản</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      <button className="btn btn-primary" style={{ marginBottom:24 }} onClick={openAdd}>+ Thêm tài khoản</button>

      {byRole.map(({ role, label, users: grp }) => (
        <div key={role} style={{ maxWidth:720, marginBottom:24 }}>
          <div className="divider">{label}</div>
          {grp.map(u => (
            <div key={u.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'#fff', borderRadius:12, border:'1.5px solid #f1f5f9', marginBottom:8, boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:avatarColor(u.name), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                {initials(u.name)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:'#1e293b', fontSize:14 }}>{u.name} {u.id === me.id && <span style={{ fontSize:11, color:'#2563eb' }}>(bạn)</span>}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{u.email}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Sửa</button>
                {u.id !== me.id && (
                  <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5' }} onClick={() => handleDelete(u)}>Xóa</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <Modal open={modal} title={editing ? 'Sửa tài khoản' : 'Thêm tài khoản'} onClose={() => setModal(false)} width={480}>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Họ và tên *</label>
          <input className="form-ctrl" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="VD: Nguyễn Văn A" />
        </div>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Email *</label>
          <input type="email" className="form-ctrl" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="VD: nva@scct.vn" />
        </div>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Chức danh</label>
          <select className="form-ctrl" value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))}>
            {ROLES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {editing && (
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#374151', marginBottom:10, cursor:'pointer' }}>
            <input type="checkbox" checked={changePw} onChange={e => setChangePw(e.target.checked)} />
            Đặt lại mật khẩu
          </label>
        )}
        {(!editing || changePw) && (
          <div style={{ marginBottom:14 }}>
            <label className="form-label">{editing ? 'Mật khẩu mới' : 'Mật khẩu *'}</label>
            <input type="password" className="form-ctrl" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder={editing ? 'Để trống = giữ nguyên' : 'Mặc định: scct@2026'} />
          </div>
        )}
        <div style={{ display:'flex', gap:8, marginTop:6 }}>
          <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
        </div>
      </Modal>
    </div>
  )
}
