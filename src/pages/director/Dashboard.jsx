import { useEffect, useState } from 'react'
import { fmtDate } from '../../utils'
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

export default function Dashboard() {
  const [devices, setDevices] = useState([])
  const [tickets, setTickets] = useState([])
  const [sites,   setSites]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/devices'), api.get('/tickets'), api.get('/sites')]).then(([d,t,s]) => {
      setDevices(d.data); setTickets(t.data); setSites(s.data); setLoading(false)
    })
  }, [])

  if (loading) return <div className="empty">Đang tải...</div>

  const open     = tickets.filter(t => t.status !== 'resolved')
  const resolved = tickets.filter(t => t.status === 'resolved')
  const overdue  = tickets.filter(t => t.status === 'in_progress' && t.due_date && new Date(t.due_date) < new Date())
  const okCount  = devices.filter(d => !d.has_open_ticket).length
  const pct      = devices.length ? Math.round(okCount / devices.length * 100) : 0

  return (
    <div>
      <div className="page-title">Bảng điều hành</div>
      <div className="page-sub">{fmtDate(new Date().toISOString())} · Tổng quan toàn bộ hệ thống</div>

      <div className="grid-4" style={{ marginBottom:32 }}>
        <StatCard val={sites.length}  label="Công trường"   sub="đang hoạt động" color="#2563eb" />
        <StatCard val={devices.length} label="Thiết bị"     sub="đang quản lý"   color="#0891b2" />
        <StatCard val={pct+'%'}        label="Hoạt động ổn" sub={`${okCount}/${devices.length} thiết bị`} color="#16a34a" />
        <StatCard val={open.length}    label="Sự cố mở"    sub="cần xử lý"       color="#ef4444" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:860 }}>
        <div>
          <div className="sec-title" style={{ marginBottom:12 }}>Tình trạng công trường</div>
          {sites.map(s => {
            const sd  = devices.filter(d => d.site_id === s.id)
            const ok  = sd.filter(d => !d.has_open_ticket).length
            const pct = sd.length ? Math.round(ok / sd.length * 100) : 100
            const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444'
            return (
              <div key={s.id} className="card card-p" style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'#1e293b' }}>{s.name}</div>
                  <span style={{ fontWeight:700, color, fontSize:13 }}>{pct}%</span>
                </div>
                <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>{s.loc} · {sd.length} thiết bị</div>
                <div className="prog-wrap"><div className="prog-bar" style={{ width:`${pct}%`, background:color }} /></div>
              </div>
            )
          })}
        </div>

        <div>
          <div className="sec-title" style={{ marginBottom:12 }}>Sự cố gần đây</div>
          {tickets.slice(0, 8).map(t => (
            <div key={t.id} className="card card-p" style={{ marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{t.device_name || t.other_label || 'Khác'}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{t.site_name || ''} · {fmtDate(t.created_at)}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{t.description?.slice(0,60)}{t.description?.length > 60 ? '...' : ''}</div>
              </div>
              <span className={`badge ${t.status === 'resolved' ? 'b-normal' : t.status === 'in_progress' ? 'b-maintain' : 'b-broken'}`} style={{ flexShrink:0, marginLeft:8 }}>
                {t.status === 'resolved' ? 'Xong' : t.status === 'in_progress' ? 'Đang làm' : 'Chờ'}
              </span>
            </div>
          ))}
          <div style={{ display:'flex', gap:16, marginTop:14 }}>
            <div style={{ textAlign:'center', flex:1, background:'#f0fdf4', borderRadius:10, padding:'10px 0' }}>
              <div style={{ fontSize:22, fontWeight:700, color:'#16a34a' }}>{resolved.length}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Đã giải quyết</div>
            </div>
            <div style={{ textAlign:'center', flex:1, background:'#fff7ed', borderRadius:10, padding:'10px 0' }}>
              <div style={{ fontSize:22, fontWeight:700, color:'#f59e0b' }}>{overdue.length}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Quá hạn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
