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

export default function Overview() {
  const [devices, setDevices]   = useState([])
  const [tickets, setTickets]   = useState([])
  const [sites,   setSites]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('/devices'), api.get('/tickets'), api.get('/sites')]).then(([d,t,s]) => {
      setDevices(d.data); setTickets(t.data); setSites(s.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty">Đang tải...</div>

  const open     = tickets.filter(t => t.status !== 'resolved')
  const overdue  = tickets.filter(t => t.status === 'in_progress' && t.due_date && new Date(t.due_date) < new Date())
  const resolved = tickets.filter(t => t.status === 'resolved')
  const okCount  = devices.filter(d => !d.has_open_ticket).length
  const pct      = devices.length ? Math.round(okCount / devices.length * 100) : 0

  return (
    <div>
      <div className="page-title">Tổng quan</div>
      <div className="page-sub">{fmtDate(new Date().toISOString())}</div>

      <div className="grid-4" style={{ marginBottom:28 }}>
        <StatCard val={pct+'%'} label="Hoạt động bình thường" sub={`${okCount}/${devices.length} thiết bị`} color="#16a34a" />
        <StatCard val={open.length}    label="Sự cố đang mở"    sub="chưa giải quyết" color="#ef4444" />
        <StatCard val={overdue.length} label="Quá hạn"          sub="cần chú ý ngay"  color="#f59e0b" />
        <StatCard val={resolved.length} label="Đã khắc phục"   sub="tổng cộng"        color="#2563eb" />
      </div>

      <div className="sec-title" style={{ marginBottom:14 }}>Tình trạng theo công trường</div>
      {sites.map(s => {
        const sd  = devices.filter(d => d.site_id === s.id)
        const ok  = sd.filter(d => !d.has_open_ticket).length
        const pct = sd.length ? Math.round(ok / sd.length * 100) : 100
        const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444'
        return (
          <div key={s.id} className="card card-p" style={{ maxWidth:600, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{s.loc} · {sd.length} thiết bị</div>
              </div>
              <span style={{ fontSize:18, fontWeight:700, color }}>{pct}%</span>
            </div>
            <div className="prog-wrap">
              <div className="prog-bar" style={{ width:`${pct}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
