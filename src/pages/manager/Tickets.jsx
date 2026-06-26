import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'
import TicketCard from '../../components/TicketCard'
import api from '../../api'

export default function MTickets() {
  const { user }  = useAuth()
  const [tickets, setTickets]   = useState([])
  const [techUsers, setTechUsers] = useState([])
  const [filter, setFilter]     = useState('open')
  const [loading, setLoading]   = useState(true)

  const load = () => Promise.all([api.get('/tickets'), api.get('/users/tech')]).then(([t, u]) => {
    setTickets(t.data); setTechUsers(u.data)
  }).finally(() => setLoading(false))
  useEffect(load, [])

  const filtered = tickets.filter(t =>
    filter === 'open'    ? t.status !== 'resolved' :
    filter === 'pending' ? t.status === 'pending'  :
    filter === 'resolved'? t.status === 'resolved' : true
  )

  if (loading) return <div className="empty">Đang tải...</div>

  return (
    <div>
      <div className="page-title">Quản lý sự cố</div>
      <div className="page-sub">{tickets.filter(t => t.status !== 'resolved').length} sự cố đang mở</div>

      <div className="filter-bar" style={{ marginBottom:18 }}>
        {[['open','Đang mở'],['pending','Chờ duyệt'],['resolved','Đã xử lý'],['all','Tất cả']].map(([v,l]) => (
          <button key={v} className={`btn btn-sm ${filter===v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth:720 }}>
        {filtered.length === 0
          ? <div className="empty">Không có phiếu nào</div>
          : filtered.map(t => (
            <TicketCard
              key={t.id} ticket={t}
              mode={t.status === 'pending' ? 'mgr-approve' : 'view'}
              onRefresh={load}
              onDelete={id => api.delete(`/tickets/${id}`).then(load).catch(e => alert(e.response?.data?.error || 'Lỗi xóa'))}
              currentUser={user}
              techUsers={techUsers}
            />
          ))}
      </div>
    </div>
  )
}
