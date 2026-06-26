import { useEffect, useState } from 'react'
import TicketCard from '../../components/TicketCard'
import api from '../../api'

export default function DTickets() {
  const [tickets, setTickets] = useState([])
  const [filter,  setFilter]  = useState('open')
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/tickets').then(r => { setTickets(r.data); setLoading(false) })
  useEffect(load, [])

  const filtered = tickets.filter(t =>
    filter === 'open'     ? t.status !== 'resolved' :
    filter === 'resolved' ? t.status === 'resolved'  : true
  )

  if (loading) return <div className="empty">Đang tải...</div>

  return (
    <div>
      <div className="page-title">Sự cố toàn hệ thống</div>
      <div className="page-sub">{tickets.filter(t => t.status !== 'resolved').length} sự cố đang mở</div>

      <div className="filter-bar" style={{ marginBottom:18 }}>
        {[['open','Đang mở'],['resolved','Đã xử lý'],['all','Tất cả']].map(([v,l]) => (
          <button key={v} className={`btn btn-sm ${filter===v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth:720 }}>
        {filtered.length === 0
          ? <div className="empty">Không có phiếu nào</div>
          : filtered.map(t => <TicketCard key={t.id} ticket={t} mode="view" onRefresh={load} />)}
      </div>
    </div>
  )
}
