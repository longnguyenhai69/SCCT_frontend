import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'
import Alert, { useAlert } from '../../components/Alert'
import { currentMonth, monthLabel, fmtDate } from '../../utils'
import api from '../../api'

function StatCard({ val, label, sub, color }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-val">{val}</div>
      <div className="stat-lbl">{label}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

export default function Monthly() {
  const { user }  = useAuth()
  const ym        = currentMonth()
  const [reports, setReports]   = useState([])
  const [tickets, setTickets]   = useState([])
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ summary:'', self_rate:'' })
  const { alert, show, hide }   = useAlert()
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('/reports'), api.get('/tickets/mine')]).then(([r, t]) => {
      setReports(r.data); setTickets(t.data); setLoading(false)
    })
  }, [])

  const myRep = reports.find(r => r.user_id === user.id && r.month === ym)
  const history = reports.filter(r => r.user_id === user.id && r.month !== ym).sort((a,b) => b.month.localeCompare(a.month))

  const monthStats = (month) => {
    const assigned = tickets.filter(t => t.approved_date?.slice(0,7) === month || t.created_at?.slice(0,7) === month).length
    const resolved = tickets.filter(t => t.status === 'resolved' && t.resolved_date?.slice(0,7) === month).length
    const open     = tickets.filter(t => t.status === 'pending' || t.status === 'in_progress').length
    const pct      = assigned > 0 ? Math.round(resolved / assigned * 100) : 0
    return { assigned, resolved, open, pct }
  }

  const stats = monthStats(ym)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.summary.trim()) { show('Vui lòng nhập tóm tắt công việc', 'info'); return }
    try {
      await api.post('/reports', { month: ym, ...form })
      show('Đã gửi báo cáo tháng!', 'success')
      setEditing(false)
      const r = await api.get('/reports')
      setReports(r.data)
    } catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  if (loading) return <div className="empty">Đang tải...</div>

  return (
    <div>
      <div className="page-title">Báo cáo tháng</div>
      <div className="page-sub">{monthLabel(ym)} · {user.name}</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      <div className="grid-4" style={{ maxWidth:640, marginBottom:22 }}>
        <StatCard val={stats.assigned} label="Được giao"     sub="phiếu sự cố" color="#2563eb" />
        <StatCard val={stats.resolved} label="Đã giải quyết" sub="trong tháng"  color="#16a34a" />
        <StatCard val={stats.open}     label="Đang mở"       sub="chưa xử lý"  color="#f59e0b" />
        <StatCard val={`${stats.pct}%`} label="Hoàn thành"  sub="tỉ lệ"        color="#8b5cf6" />
      </div>

      {/* Form / View báo cáo tháng hiện tại */}
      {(!myRep || editing) ? (
        <div className="card card-p4" style={{ maxWidth:640, marginBottom:20 }}>
          <div className="sec-title" style={{ marginBottom:14 }}>Báo cáo {monthLabel(ym)}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:10 }}>
              <label className="form-label">Tóm tắt công việc trong tháng *</label>
              <textarea className="form-ctrl" rows={4} placeholder="Mô tả các công việc đã thực hiện..." value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} defaultValue={myRep?.summary} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="form-label">Tự đánh giá kết quả</label>
              <textarea className="form-ctrl" rows={2} placeholder="Đánh giá mức độ hoàn thành..." value={form.self_rate} onChange={e => setForm(f => ({...f, self_rate: e.target.value}))} defaultValue={myRep?.self_rate} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="submit" className="btn btn-primary">Gửi báo cáo</button>
              {editing && <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Hủy</button>}
            </div>
          </form>
        </div>
      ) : (
        <div className="card card-p4" style={{ maxWidth:640, marginBottom:20, borderLeft:'4px solid #16a34a' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div className="sec-title" style={{ color:'#16a34a' }}>✓ Đã gửi báo cáo {monthLabel(ym)}</div>
            <span style={{ fontSize:11, color:'#94a3b8' }}>{fmtDate(myRep.submitted_at)}</span>
          </div>
          <div style={{ marginBottom:10 }}>
            <label className="form-label">Tóm tắt công việc</label>
            <div className="note-box">{myRep.summary || '(Không có)'}</div>
          </div>
          {myRep.self_rate && (
            <div style={{ marginBottom:10 }}>
              <label className="form-label">Tự đánh giá</label>
              <div className="note-box">{myRep.self_rate}</div>
            </div>
          )}
          {myRep.mgr_comment && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 14px', marginTop:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1d4ed8', marginBottom:4 }}>Nhận xét trưởng phòng</div>
              <div style={{ fontSize:13, color:'#1e40af' }}>{myRep.mgr_comment}</div>
            </div>
          )}
          <button className="btn btn-outline" style={{ marginTop:12, fontSize:12 }} onClick={() => { setForm({ summary: myRep.summary||'', self_rate: myRep.self_rate||'' }); setEditing(true) }}>Chỉnh sửa lại</button>
        </div>
      )}

      {/* Lịch sử tháng trước */}
      {history.length > 0 && (
        <>
          <div className="sec-title" style={{ marginBottom:10 }}>Báo cáo các tháng trước</div>
          {history.map(r => {
            const st = monthStats(r.month)
            return (
              <details key={r.id} className="card card-p" style={{ maxWidth:640, marginBottom:8 }}>
                <summary style={{ cursor:'pointer', fontWeight:600, color:'#1e293b', display:'flex', justifyContent:'space-between', alignItems:'center', listStyle:'none', userSelect:'none' }}>
                  <span>{monthLabel(r.month)}</span>
                  <span style={{ fontSize:12, color:'#64748b', fontWeight:400 }}>Giao: {st.assigned} · Giải quyết: {st.resolved} · {st.pct}%</span>
                </summary>
                <div style={{ marginTop:10, borderTop:'1px solid #f1f5f9', paddingTop:10 }}>
                  <div className="note-box" style={{ marginBottom:8 }}>{r.summary}</div>
                  {r.self_rate && <div className="note-box" style={{ marginBottom:8 }}>{r.self_rate}</div>}
                  {r.mgr_comment && (
                    <div style={{ background:'#eff6ff', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#1e40af' }}>{r.mgr_comment}</div>
                  )}
                </div>
              </details>
            )
          })}
        </>
      )}
    </div>
  )
}
