import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import Alert, { useAlert } from '../../components/Alert'
import { InspectBadge } from '../../components/Badge'
import { fmtDate } from '../../utils'
import api from '../../api'

const EMPTY = { name:'', loc:'', type:'', reg_no:'', inspect_expiry:'' }
const TYPES  = ['Phương tiện thủy', 'Bốc xúc']

export default function Sites() {
  const [sites,   setSites]   = useState([])
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const { alert, show, hide } = useAlert()

  const load = () => api.get('/sites').then(r => setSites(r.data))
  useEffect(load, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (s) => { setEditing(s); setForm({ name:s.name, loc:s.loc||'', type:s.type||'', reg_no:s.reg_no||'', inspect_expiry:s.inspect_expiry?.slice(0,10)||'' }); setModal(true) }

  async function handleSave() {
    if (!form.name) { show('Vui lòng nhập tên công trường', 'info'); return }
    try {
      const isThuy = form.type === 'Phương tiện thủy'
      const data   = { ...form, reg_no: isThuy ? form.reg_no : null, inspect_expiry: isThuy ? form.inspect_expiry || null : null }
      editing ? await api.put(`/sites/${editing.id}`, data) : await api.post('/sites', data)
      show(editing ? 'Đã cập nhật' : 'Đã thêm công trường', 'success')
      setModal(false); load()
    } catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  async function handleDelete(s) {
    if (!confirm(`Xóa công trường "${s.name}"?`)) return
    try { await api.delete(`/sites/${s.id}`); load() }
    catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  return (
    <div>
      <div className="page-title">Công trường</div>
      <div className="page-sub">{sites.length} công trường đang quản lý</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      <button className="btn btn-primary" style={{ marginBottom:20 }} onClick={openAdd}>+ Thêm công trường</button>

      <div style={{ maxWidth:680 }}>
        {sites.map(s => (
          <div key={s.id} className="card card-p4" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:4 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{s.loc}</div>
                {s.type && <span style={{ fontSize:11, background:'#dbeafe', color:'#1d4ed8', padding:'2px 8px', borderRadius:20, fontWeight:600, display:'inline-block', marginTop:6 }}>{s.type}</span>}
                {s.reg_no && <div style={{ fontSize:12, color:'#374151', marginTop:6 }}>Số ĐK: <b>{s.reg_no}</b></div>}
                {s.inspect_expiry && <div style={{ marginTop:6 }}><InspectBadge date={s.inspect_expiry} /></div>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>Sửa</button>
                <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5' }} onClick={() => handleDelete(s)}>Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title={editing ? 'Sửa công trường' : 'Thêm công trường'} onClose={() => setModal(false)}>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Tên công trường *</label>
          <input className="form-ctrl" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="VD: Cảng Sài Gòn" />
        </div>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Địa điểm</label>
          <input className="form-ctrl" value={form.loc} onChange={e => setForm(f => ({...f, loc: e.target.value}))} placeholder="VD: Quận 4, TP.HCM" />
        </div>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Loại công trường</label>
          <select className="form-ctrl" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
            <option value="">-- Chọn loại --</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {form.type === 'Phương tiện thủy' && (
          <>
            <div style={{ marginBottom:10 }}>
              <label className="form-label">Số đăng ký</label>
              <input className="form-ctrl" value={form.reg_no} onChange={e => setForm(f => ({...f, reg_no: e.target.value}))} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label className="form-label">Hạn đăng kiểm</label>
              <input type="date" className="form-ctrl" value={form.inspect_expiry} onChange={e => setForm(f => ({...f, inspect_expiry: e.target.value}))} />
            </div>
          </>
        )}
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Lưu thay đổi' : 'Thêm'}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
        </div>
      </Modal>
    </div>
  )
}
