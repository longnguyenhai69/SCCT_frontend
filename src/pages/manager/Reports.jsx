import { useEffect, useState } from 'react'
import Alert, { useAlert } from '../../components/Alert'
import { currentMonth, monthLabel, fmtDate, ROLE_LABEL } from '../../utils'
import api from '../../api'

export default function MReports() {
  const [selMonth, setSelMonth] = useState(currentMonth())
  const [stats,    setStats]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const { alert, show, hide }   = useAlert()
  const [comments, setComments] = useState({})

  const load = (month) => {
    setLoading(true)
    api.get(`/reports/stats/${month}`).then(r => { setStats(r.data) }).finally(() => setLoading(false))
  }
  useEffect(() => load(selMonth), [selMonth])

  const handleMonthChange = (e) => { setSelMonth(e.target.value); }

  async function saveComment(reportId, userId) {
    try {
      await api.put(`/reports/${reportId}/comment`, { mgr_comment: comments[userId] || '' })
      show('Đã lưu nhận xét', 'success')
      load(selMonth)
    } catch { show('Lỗi khi lưu', 'info') }
  }

  const months = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0,7))
  }

  return (
    <div>
      <div className="page-title">Báo cáo nhân viên</div>
      <div className="page-sub">Theo dõi tiến độ và báo cáo tháng</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      <div className="filter-bar" style={{ marginBottom:22 }}>
        <label className="form-label" style={{ margin:0, fontSize:13 }}>Chọn tháng:</label>
        <select className="form-ctrl" style={{ width:'auto' }} value={selMonth} onChange={handleMonthChange}>
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      {loading && <div className="empty">Đang tải...</div>}

      {!loading && stats.map(({ user, stats: s, report }) => {
        const pct   = s.assigned > 0 ? Math.round(s.resolved / s.assigned * 100) : 0
        const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444'
        return (
          <div key={user.id} className="card card-p4" style={{ maxWidth:700, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{user.name}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{ROLE_LABEL[user.role]}</div>
              </div>
              {report
                ? <span className="badge b-normal">Đã nộp {fmtDate(report.submitted_at)}</span>
                : <span className="badge b-broken">Chưa nộp</span>}
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              {[['#2563eb','#eff6ff',s.assigned,'Được giao'],['#16a34a','#f0fdf4',s.resolved,'Giải quyết'],['#f59e0b','#fff7ed',s.open,'Đang mở']].map(([c,bg,v,l]) => (
                <div key={l} style={{ textAlign:'center', background:bg, borderRadius:10, padding:'8px 16px', minWidth:70 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{l}</div>
                </div>
              ))}
              <div style={{ flex:1, minWidth:140, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <span style={{ color:'#374151' }}>Hoàn thành</span>
                  <span style={{ fontWeight:700, color }}>{pct}%</span>
                </div>
                <div className="prog-wrap">
                  <div className="prog-bar" style={{ width:`${pct}%`, background:color }} />
                </div>
              </div>
            </div>

            {report ? (
              <>
                <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 12px', marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:4 }}>Tóm tắt công việc</div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{report.summary}</div>
                  {report.self_rate && <>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', margin:'8px 0 4px' }}>Tự đánh giá</div>
                    <div style={{ fontSize:13, color:'#374151' }}>{report.self_rate}</div>
                  </>}
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <label className="form-label">Nhận xét trưởng phòng</label>
                    <textarea className="form-ctrl" rows={2} placeholder="Nhập nhận xét..."
                      defaultValue={report.mgr_comment || ''}
                      onChange={e => setComments(c => ({...c, [user.id]: e.target.value}))} />
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ whiteSpace:'nowrap' }} onClick={() => saveComment(report.id, user.id)}>Lưu</button>
                </div>
              </>
            ) : (
              <div style={{ fontSize:13, color:'#94a3b8', fontStyle:'italic' }}>Nhân viên chưa nộp báo cáo tháng này.</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
