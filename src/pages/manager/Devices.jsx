import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import Alert, { useAlert } from '../../components/Alert'
import { StatusBadge, InspectBadge } from '../../components/Badge'
import api from '../../api'

const EMPTY = { name:'', type:'', status:'normal', site_id:'', assigned_to:'', reg_no:'', inspect_expiry:'', description:'' }
const STATUS_OPTS = [['normal','Bình thường'],['maintain','Đang bảo trì'],['pending','Chờ linh kiện']]

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [sites,   setSites]   = useState([])
  const [users,   setUsers]   = useState([])
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [search,    setSearch]    = useState('')
  const [collapsed, setCollapsed] = useState({})
  const { alert, show, hide } = useAlert()

  const toggleGroup = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

  const load = () => Promise.all([api.get('/devices'), api.get('/sites'), api.get('/users/tech')]).then(([d,s,u]) => {
    setDevices(d.data); setSites(s.data); setUsers(u.data)
  })
  useEffect(load, [])

  const selSite = sites.find(s => s.id == form.site_id)
  const isThuy  = selSite?.type === 'Phương tiện thủy'

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (d) => {
    setEditing(d)
    setForm({ name:d.name, type:d.type||'', status:d.status||'normal', site_id:d.site_id||'', assigned_to:d.assigned_to||'', reg_no:d.reg_no||'', inspect_expiry:d.inspect_expiry?.slice(0,10)||'', description:d.description||'' })
    setModal(true)
  }

  async function handleSave() {
    if (!form.name) { show('Vui lòng nhập tên thiết bị', 'info'); return }
    try {
      const data = { ...form, reg_no: isThuy ? null : form.reg_no||null, inspect_expiry: isThuy ? null : form.inspect_expiry||null }
      editing ? await api.put(`/devices/${editing.id}`, data) : await api.post('/devices', data)
      show(editing ? 'Đã cập nhật' : 'Đã thêm thiết bị', 'success')
      setModal(false); load()
    } catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  async function handleDelete(d) {
    if (!confirm(`Xóa thiết bị "${d.name}"?`)) return
    try { await api.delete(`/devices/${d.id}`); load() }
    catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  const filtered = devices.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.site_name?.toLowerCase().includes(search.toLowerCase()))

  const grouped = filtered.reduce((acc, d) => {
    const k = d.site_id || '__none__'
    if (!acc[k]) acc[k] = { name: d.site_name||'Chưa có công trường', devices: [] }
    acc[k].devices.push(d)
    return acc
  }, {})

  return (
    <div>
      <div className="page-title">Quản lý thiết bị</div>
      <div className="page-sub">{devices.length} thiết bị</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm thiết bị</button>
        <input className="form-ctrl" style={{ maxWidth:280 }} placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {Object.entries(grouped).map(([key, g]) => {
        const isOpen  = !collapsed[key]
        const broken  = g.devices.filter(d => d.has_open_ticket).length
        return (
          <div key={key} style={{ marginBottom:10, maxWidth:720 }}>
            <div
              onClick={() => toggleGroup(key)}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px', borderRadius: isOpen ? '12px 12px 0 0' : 12,
                background:'#1e3a5f', color:'#fff', cursor:'pointer', userSelect:'none',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{g.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, opacity:.7 }}>{g.devices.length} thiết bị</span>
                {broken > 0 && (
                  <span style={{ fontSize:11, background:'#ef4444', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{broken} sự cố</span>
                )}
                <span style={{ fontSize:16, opacity:.8, display:'inline-block', transition:'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ border:'1.5px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
                {g.devices.map((d, idx) => (
                  <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#fff', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#1e293b' }}>{d.name} {d.reg_no && <span style={{ fontSize:11, color:'#64748b', fontWeight:400 }}>({d.reg_no})</span>}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{d.type} · {d.assigned_name || 'Chưa phân công'}</div>
                      {d.description && <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{d.description}</div>}
                      {d.inspect_expiry && <div style={{ marginTop:4 }}><InspectBadge date={d.inspect_expiry} /></div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <StatusBadge device={d} />
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>Sửa</button>
                      <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5' }} onClick={() => handleDelete(d)}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Modal open={modal} title={editing ? 'Sửa thiết bị' : 'Thêm thiết bị'} onClose={() => setModal(false)} width={500}>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Tên thiết bị *</label>
          <input className="form-ctrl" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label className="form-label">Loại thiết bị</label>
            <input className="form-ctrl" value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))} placeholder="VD: Máy khoan" />
          </div>
          <div>
            <label className="form-label">Trạng thái</label>
            <select className="form-ctrl" value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))}>
              {STATUS_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label className="form-label">Công trường</label>
            <select className="form-ctrl" value={form.site_id} onChange={e => setForm(f => ({...f, site_id:e.target.value}))}>
              <option value="">-- Chưa có --</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Phân công cho</label>
            <select className="form-ctrl" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to:e.target.value}))}>
              <option value="">-- Chưa phân công --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        {!isThuy && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label className="form-label">Số đăng ký</label>
              <input className="form-ctrl" value={form.reg_no} onChange={e => setForm(f => ({...f, reg_no:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Hạn đăng kiểm</label>
              <input type="date" className="form-ctrl" value={form.inspect_expiry} onChange={e => setForm(f => ({...f, inspect_expiry:e.target.value}))} />
            </div>
          </div>
        )}
        <div style={{ marginBottom:16 }}>
          <label className="form-label">Mô tả / Đặc điểm</label>
          <textarea className="form-ctrl" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} placeholder="VD: Công suất 200kVA..." />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Lưu thay đổi' : 'Thêm thiết bị'}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
        </div>
      </Modal>
    </div>
  )
}
