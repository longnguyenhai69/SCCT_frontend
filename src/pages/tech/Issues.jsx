import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'
import TicketCard from '../../components/TicketCard'
import Alert, { useAlert } from '../../components/Alert'
import api from '../../api'

export default function Issues() {
  const { user } = useAuth()
  const [tickets, setTickets]   = useState([])
  const [devices, setDevices]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ device_id: '', description: '', plan: '', due_date: '', other_label: '', is_other: false, incident_time: '', operating_hours: '', operator: '', initial_cause: '' })
  const { alert, show, hide }   = useAlert()

  const load = () => {
    Promise.all([api.get('/tickets/mine'), api.get('/devices/mine')]).then(([t, d]) => {
      setTickets(t.data); setDevices(d.data)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const pending    = tickets.filter(t => t.status === 'pending')
  const inProgress = tickets.filter(t => t.status === 'in_progress')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.is_other && !form.device_id) { show('Vui lòng chọn thiết bị', 'info'); return }
    if (form.is_other && !form.other_label) { show('Vui lòng mô tả đối tượng', 'info'); return }
    if (!form.description) { show('Vui lòng mô tả sự cố', 'info'); return }
    try {
      const sel = devices.find(d => d.id == form.device_id)
      await api.post('/tickets', {
        device_id:       form.is_other ? null : form.device_id || null,
        site_id:         form.is_other ? null : sel?.site_id || null,
        description:     form.description,
        plan:            form.plan,
        due_date:        form.due_date || null,
        other_label:     form.is_other ? form.other_label : '',
        incident_time:   form.incident_time || null,
        operating_hours: form.operating_hours ? Number(form.operating_hours) : null,
        operator:        form.operator,
        initial_cause:   form.initial_cause,
      })
      show('Đã gửi phiếu sự cố! Chờ trưởng phòng phê duyệt.', 'success')
      setForm({ device_id:'', description:'', plan:'', due_date:'', other_label:'', is_other:false, incident_time:'', operating_hours:'', operator:'', initial_cause:'' })
      setTimeout(load, 800)
    } catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  if (loading) return <div className="empty">Đang tải...</div>

  return (
    <div>
      <div className="page-title">Sự cố thiết bị</div>
      <div className="page-sub">{pending.length} chờ phê duyệt · {inProgress.length} đang thực hiện</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      {/* Form tạo phiếu */}
      <div className="card card-p4" style={{ maxWidth:540, marginBottom:24 }}>
        <div className="sec-title" style={{ marginBottom:14 }}>+ Tạo phiếu sự cố mới</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:10 }}>
            <label className="form-label">Thiết bị / Đối tượng *</label>
            <select className="form-ctrl" value={form.is_other ? '__other__' : form.device_id}
              onChange={e => {
                const v = e.target.value
                setForm(f => ({ ...f, is_other: v === '__other__', device_id: v === '__other__' ? '' : v }))
              }}>
              <option value="">-- Chọn thiết bị --</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.site_name || 'Chưa có CT'})</option>)}
              <option value="__other__">── Khác (không phải thiết bị cụ thể) ──</option>
            </select>
          </div>
          {form.is_other && (
            <div style={{ marginBottom:10 }}>
              <label className="form-label">Mô tả đối tượng *</label>
              <input className="form-ctrl" placeholder="VD: Vật tư, nhân lực, an toàn lao động..." value={form.other_label} onChange={e => setForm(f => ({...f, other_label: e.target.value}))} />
            </div>
          )}
          {!form.is_other && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label className="form-label">Thời gian xảy ra sự cố</label>
                  <input type="datetime-local" className="form-ctrl" value={form.incident_time} onChange={e => setForm(f => ({...f, incident_time: e.target.value}))} />
                </div>
                <div>
                  <label className="form-label">Giờ hoạt động (h)</label>
                  <input type="number" className="form-ctrl" min={0} placeholder="VD: 1240" value={form.operating_hours} onChange={e => setForm(f => ({...f, operating_hours: e.target.value}))} />
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <label className="form-label">Người vận hành</label>
                <input className="form-ctrl" placeholder="Họ tên người đang vận hành thiết bị..." value={form.operator} onChange={e => setForm(f => ({...f, operator: e.target.value}))} />
              </div>
            </>
          )}
          <div style={{ marginBottom:10 }}>
            <label className="form-label">{form.is_other ? 'Mô tả công việc *' : 'Mô tả sự cố *'}</label>
            <textarea className="form-ctrl" rows={3} placeholder={form.is_other ? 'Mô tả chi tiết công việc cần thực hiện...' : 'Mô tả chi tiết lỗi, triệu chứng...'} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          {!form.is_other && (
            <div style={{ marginBottom:10 }}>
              <label className="form-label">Xác định nguyên nhân ban đầu</label>
              <textarea className="form-ctrl" rows={2} placeholder="Nhận định ban đầu về nguyên nhân gây sự cố..." value={form.initial_cause} onChange={e => setForm(f => ({...f, initial_cause: e.target.value}))} />
            </div>
          )}
          <div style={{ marginBottom:10 }}>
            <label className="form-label">Đề xuất phương án</label>
            <textarea className="form-ctrl" rows={2} placeholder="Hướng xử lý dự kiến..." value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="form-label">Dự kiến ngày hoàn thành</label>
            <input type="date" className="form-ctrl" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
          </div>
          <button type="submit" className="btn btn-primary">Gửi phiếu sự cố</button>
        </form>
      </div>

      {/* Danh sách */}
      <div className="sec-title" style={{ marginBottom:10, color:'#b45309' }}>Chờ phê duyệt ({pending.length})</div>
      <div style={{ maxWidth:700, marginBottom:24 }}>
        {pending.length === 0 ? <div className="empty">Không có phiếu nào đang chờ</div>
          : pending.map(t => <TicketCard key={t.id} ticket={t} mode="view" onRefresh={load} currentUser={user} />)}
      </div>

      <div className="sec-title" style={{ marginBottom:10 }}>Đang thực hiện ({inProgress.length})</div>
      <div style={{ maxWidth:700 }}>
        {inProgress.length === 0 ? <div className="empty">Không có phiếu nào đang thực hiện</div>
          : inProgress.map(t => <TicketCard key={t.id} ticket={t} mode="tech" onRefresh={load} currentUser={user} />)}
      </div>
    </div>
  )
}
