import { getDeviceStatus, STATUS_LABEL, TICKET_STATUS_LABEL, inspectStatus } from '../utils'

export function StatusBadge({ device }) {
  const s = getDeviceStatus(device)
  const cls = { normal: 'b-normal', broken: 'b-broken', maintain: 'b-maintain', pending: 'b-pending' }
  return <span className={`badge ${cls[s] || 'b-normal'}`}>{STATUS_LABEL[s] || s}</span>
}

export function TicketBadge({ status }) {
  const cls = { pending: 'b-maintain', in_progress: 'b-broken', resolved: 'b-normal' }
  return <span className={`badge ${cls[status] || 'b-normal'}`}>{TICKET_STATUS_LABEL[status] || status}</span>
}

export function InspectBadge({ date }) {
  const s = inspectStatus(date)
  if (!s) return null
  const style = {
    red:    { background:'#fee2e2', color:'#dc2626', border:'1px solid rgba(220,38,38,.2)' },
    yellow: { background:'#fef9c3', color:'#a16207', border:'1px solid rgba(161,98,7,.2)' },
    green:  { background:'#dcfce7', color:'#15803d', border:'1px solid rgba(21,128,61,.2)' },
  }[s.color]
  return (
    <span style={{ ...style, fontSize:11.5, fontWeight:700, padding:'3px 10px', borderRadius:20, display:'inline-block' }}>
      {s.label}
    </span>
  )
}
