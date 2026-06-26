import { useState } from 'react'
import { TicketBadge } from './Badge'
import { fmtDate, ROLE_LABEL } from '../utils'
import api from '../api'

export default function TicketCard({ ticket: t, mode = 'view', onRefresh, onDelete, currentUser, techUsers = [] }) {
  const [updateNote, setUpdateNote] = useState('')
  const [resolveNote, setResolveNote] = useState('')
  const [approvedPlan, setApprovedPlan] = useState(t.approved_plan || '')
  const [selectedAssignees, setSelectedAssignees] = useState(t.assignees?.map(a => a.id) || [])
  const [dueDate, setDueDate] = useState(t.due_date?.slice(0,10) || '')
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [showResolveForm, setShowResolveForm] = useState(false)

  const isOther  = !t.device_id
  const overdue  = t.due_date && new Date(t.due_date) < new Date() && t.status === 'in_progress'
  const deviceLabel = isOther ? (t.other_label || 'Khác') : (t.device_name || '—')

  async function handleApprove() {
    try {
      await api.put(`/tickets/${t.id}/approve`, { approved_plan: approvedPlan, assignee_ids: selectedAssignees, due_date: dueDate })
      onRefresh?.()
    } catch (err) { alert(err.response?.data?.error || 'Lỗi') }
  }

  async function handleAddUpdate() {
    if (!updateNote.trim()) return
    try {
      await api.post(`/tickets/${t.id}/updates`, { note: updateNote })
      setUpdateNote(''); setShowUpdateForm(false); onRefresh?.()
    } catch (err) { alert(err.response?.data?.error || 'Lỗi') }
  }

  async function handleResolve() {
    try {
      await api.put(`/tickets/${t.id}/resolve`, { resolve_note: resolveNote })
      setShowResolveForm(false); onRefresh?.()
    } catch (err) { alert(err.response?.data?.error || 'Lỗi') }
  }

  const toggleAssignee = id => setSelectedAssignees(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const borderColor = { pending:'#f59e0b', in_progress:'#ef4444', resolved:'#16a34a' }[t.status] || '#e5e7eb'

  return (
    <div className="card card-p4" style={{ marginBottom:12, maxWidth:680, borderLeft:`4px solid ${borderColor}` }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>
            {deviceLabel} {isOther && <span style={{ fontSize:11, background:'#f1f5f9', color:'#64748b', padding:'1px 8px', borderRadius:20, fontWeight:600 }}>Khác</span>}
          </div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
            {t.site_name || '—'} &nbsp;·&nbsp; {t.creator_name} &nbsp;·&nbsp; {fmtDate(t.created_at)}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center' }}>
          <TicketBadge status={t.status} />
          {overdue && <span className="badge b-broken">⚠ Quá hạn</span>}
          {isOther && <span className="badge b-pending">Khác</span>}
          {onDelete && (
            <button
              onClick={() => { if (window.confirm('Xóa phiếu sự cố này?')) onDelete(t.id) }}
              title="Xóa phiếu"
              style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1, padding:'0 2px', marginLeft:4 }}
              onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
            >×</button>
          )}
        </div>
      </div>

      {/* Thông tin sự cố */}
      {(t.incident_time || t.operating_hours || t.operator) && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 20px', marginBottom:10, fontSize:12, color:'#64748b' }}>
          {t.incident_time && <span>🕐 <b>Thời gian:</b> {new Date(t.incident_time).toLocaleString('vi-VN')}</span>}
          {t.operating_hours != null && <span>⏱ <b>Giờ HĐ:</b> {t.operating_hours} h</span>}
          {t.operator && <span>👤 <b>Người VH:</b> {t.operator}</span>}
        </div>
      )}

      {/* Mô tả */}
      <div className="note-box" style={{ marginBottom:10 }}>{t.description}</div>

      {/* Nguyên nhân ban đầu */}
      {t.initial_cause && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#b45309', textTransform:'uppercase', marginBottom:4 }}>Nguyên nhân ban đầu</div>
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#9a3412' }}>{t.initial_cause}</div>
        </div>
      )}

      {/* Đề xuất nhân viên */}
      {t.plan && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#a16207', textTransform:'uppercase', marginBottom:4 }}>Đề xuất phương án</div>
          <div style={{ background:'#fefce8', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#92400e' }}>{t.plan}</div>
        </div>
      )}

      {/* Phương án đã duyệt */}
      {t.approved_plan && t.status !== 'pending' && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', marginBottom:4 }}>Phương án phê duyệt</div>
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#1e40af' }}>{t.approved_plan}</div>
        </div>
      )}

      {/* Assignees */}
      {t.assignees?.length > 0 && (
        <div style={{ marginBottom:8, display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Phân công:</span>
          {t.assignees.map(a => (
            <span key={a.id} style={{ fontSize:11, background:'#e0e7ff', color:'#3730a3', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{a.name}</span>
          ))}
        </div>
      )}

      {/* Due date */}
      {t.due_date && (
        <div style={{ fontSize:12, color: overdue ? '#dc2626' : '#7c3aed', marginBottom:8 }}>
          {overdue ? '⚠ Quá hạn: ' : 'Dự kiến: '}{fmtDate(t.due_date)}
        </div>
      )}

      {/* Nhật ký tiến độ */}
      {t.updates?.length > 0 && (
        <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:8, marginTop:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Nhật ký tiến độ</div>
          {t.updates.map((u, i) => (
            <div key={i} style={{ background:'#f8fafc', borderRadius:6, padding:'6px 10px', marginBottom:5, fontSize:12, color:'#475569' }}>
              <span style={{ color:'#94a3b8', marginRight:6 }}>{fmtDate(u.created_at)}</span>{u.note}
            </div>
          ))}
        </div>
      )}

      {/* Kết quả xử lý */}
      {t.status === 'resolved' && t.resolve_note && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', marginTop:8, fontSize:13, color:'#15803d' }}>
          <b>Kết quả:</b> {t.resolve_note} <span style={{ color:'#86efac' }}>— {fmtDate(t.resolved_date)}</span>
        </div>
      )}

      {/* === MODE: TECH — buttons cập nhật / hoàn thành === */}
      {mode === 'tech' && t.status === 'in_progress' && (
        <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
          {!showUpdateForm && !showResolveForm && (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => setShowUpdateForm(true)}>+ Cập nhật tiến độ</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowResolveForm(true)}>✓ Đánh dấu hoàn thành</button>
            </>
          )}
          {showUpdateForm && (
            <div style={{ width:'100%', marginTop:6 }}>
              <textarea className="form-ctrl" rows={2} placeholder="Nhập tiến độ xử lý..." value={updateNote} onChange={e => setUpdateNote(e.target.value)} style={{ marginBottom:8 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleAddUpdate}>Gửi</button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowUpdateForm(false)}>Hủy</button>
              </div>
            </div>
          )}
          {showResolveForm && (
            <div style={{ width:'100%', marginTop:6 }}>
              <textarea className="form-ctrl" rows={2} placeholder="Mô tả kết quả đã xử lý..." value={resolveNote} onChange={e => setResolveNote(e.target.value)} style={{ marginBottom:8 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleResolve}>Xác nhận hoàn thành</button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowResolveForm(false)}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === MODE: MGR-APPROVE === */}
      {mode === 'mgr-approve' && t.status === 'pending' && (
        <div style={{ borderTop:'1px solid #f1f5f9', marginTop:12, paddingTop:12 }}>
          <div style={{ marginBottom:10 }}>
            <label className="form-label">Phương án phê duyệt</label>
            <textarea className="form-ctrl" rows={2} value={approvedPlan} onChange={e => setApprovedPlan(e.target.value)} placeholder="Điều chỉnh hoặc xác nhận phương án..." />
          </div>
          <div style={{ marginBottom:10 }}>
            <label className="form-label">Phân công nhân viên</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {techUsers.map(u => (
                <label key={u.id} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={selectedAssignees.includes(u.id)} onChange={() => toggleAssignee(u.id)} />
                  {u.name} <span style={{ fontSize:11, color:'#94a3b8' }}>({ROLE_LABEL[u.role]?.split(' ')[0]})</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label className="form-label">Hạn hoàn thành</label>
            <input type="date" className="form-ctrl" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ maxWidth:200 }} />
          </div>
          <button className="btn btn-primary" onClick={handleApprove}>✓ Phê duyệt & Phân công</button>
        </div>
      )}
    </div>
  )
}
