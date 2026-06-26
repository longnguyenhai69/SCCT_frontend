import { useEffect, useState } from 'react'
import TicketCard from '../../components/TicketCard'
import api from '../../api'

export default function History() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tickets/mine').then(r => {
      setTickets(r.data.filter(t => t.status === 'resolved'))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty">Đang tải...</div>

  return (
    <div>
      <div className="page-title">Lịch sử sự cố</div>
      <div className="page-sub">{tickets.length} phiếu đã khắc phục</div>
      <div style={{ maxWidth:700 }}>
        {tickets.length === 0
          ? <div className="empty">Chưa có sự cố nào được khắc phục</div>
          : tickets.map(t => <TicketCard key={t.id} ticket={t} mode="view" />)}
      </div>
    </div>
  )
}
