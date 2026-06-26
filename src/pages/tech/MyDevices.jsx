import { useEffect, useState } from 'react'
import { StatusBadge, InspectBadge } from '../../components/Badge'
import api from '../../api'

export default function MyDevices() {
  const [devices, setDevices]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    api.get('/devices/mine').then(r => { setDevices(r.data) }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty">Đang tải...</div>

  const grouped = devices.reduce((acc, d) => {
    const key = d.site_id || '__none__'
    if (!acc[key]) acc[key] = { name: d.site_name || 'Chưa có công trường', loc: d.site_loc || '', type: d.site_type, devices: [] }
    acc[key].devices.push(d)
    return acc
  }, {})

  const toggle = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

  return (
    <div>
      <div className="page-title">Thiết bị của tôi</div>
      <div className="page-sub">Được phân công quản lý {devices.length} thiết bị</div>

      {devices.length === 0 && <div className="empty">Chưa được phân công thiết bị nào</div>}

      {Object.entries(grouped).map(([key, g]) => {
        const isOpen = !collapsed[key]
        const broken = g.devices.filter(d => d.open_ticket_count > 0).length
        return (
          <div key={key} style={{ maxWidth:640, marginBottom:8 }}>
            <div
              onClick={() => toggle(key)}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px', borderRadius: isOpen ? '12px 12px 0 0' : 12,
                background:'#1e3a5f', color:'#fff', cursor:'pointer',
                userSelect:'none', transition:'border-radius .15s',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{g.name}</span>
                {g.loc && <span style={{ fontSize:12, opacity:.65 }}>{g.loc}</span>}
                {g.type && (
                  <span style={{ fontSize:11, background:'rgba(59,130,246,.35)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{g.type}</span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, opacity:.7 }}>{g.devices.length} thiết bị</span>
                {broken > 0 && (
                  <span style={{ fontSize:11, background:'#ef4444', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{broken} sự cố</span>
                )}
                <span style={{ fontSize:16, opacity:.8, transition:'transform .2s', display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ border:'1.5px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
                {g.devices.map((d, idx) => (
                  <div key={d.id} style={{ padding:'14px 18px', background:'#fff', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{d.name}</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{d.type}</div>
                        {d.reg_no && <div style={{ fontSize:12, color:'#374151', marginTop:2 }}>Số đăng ký: <b>{d.reg_no}</b></div>}
                      </div>
                      <StatusBadge device={d} />
                    </div>
                    {d.description && (
                      <div style={{ background:'#f8fafc', borderRadius:8, padding:'7px 10px', fontSize:12, color:'#475569', marginBottom:8, lineHeight:1.5 }}>{d.description}</div>
                    )}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: d.inspect_expiry ? 6 : 0 }}>
                      {d.open_ticket_count > 0 && (
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#fee2e2', color:'#dc2626', fontWeight:600 }}>{d.open_ticket_count} sự cố đang mở</span>
                      )}
                    </div>
                    {d.inspect_expiry && (
                      <InspectBadge date={d.inspect_expiry} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
