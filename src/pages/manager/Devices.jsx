import { useEffect, useState, useRef } from 'react'
import Modal from '../../components/Modal'
import Alert, { useAlert } from '../../components/Alert'
import { StatusBadge, InspectBadge } from '../../components/Badge'
import api from '../../api'

const EMPTY = { name:'', type:'', status:'normal', site_id:'', assigned_to:'', reg_no:'', inspect_expiry:'', description:'' }
const STATUS_OPTS = [['normal','Bình thường'],['maintain','Đang bảo trì'],['pending','Chờ linh kiện']]

// Khớp tiêu đề cột Excel → field theo từ khóa (chịu được khác biệt nhỏ về chữ).
// Thứ tự quan trọng: 'đăng ký' kiểm trước 'đăng kiểm' để không nhầm.
const HEADER_MATCHERS = [
  ['name',    h => h.includes('tên')],
  ['type',    h => h.includes('loại')],
  ['site',    h => h.includes('công trường')],
  ['assign',  h => h.includes('phân công')],
  ['reg_no',  h => h.includes('đăng ký')],
  ['inspect', h => h.includes('đăng kiểm')],
  ['desc',    h => h.includes('mô tả')],
]
const norm = s => String(s ?? '').trim()
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const th = { textAlign:'left', padding:'8px 10px', fontWeight:600, color:'#475569', borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }
const td = { padding:'7px 10px', borderBottom:'1px solid #f1f5f9', verticalAlign:'top' }

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [sites,   setSites]   = useState([])
  const [users,   setUsers]   = useState([])
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [search,    setSearch]    = useState('')
  const [collapsed, setCollapsed] = useState({})
  const { alert, show, hide } = useAlert()

  const [importRows, setImportRows] = useState(null)   // null = đóng modal xem trước
  const [importing,  setImporting]  = useState(false)
  const fileRef = useRef(null)

  const toggleGroup = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

  const load = () => Promise.all([api.get('/devices'), api.get('/sites'), api.get('/users/tech')]).then(([d,s,u]) => {
    setDevices(d.data); setSites(s.data); setUsers(u.data)
  })
  useEffect(load, [])

  const selSite = sites.find(s => s.id == form.site_id)
  const isThuy  = selSite?.type === 'Phương tiện thủy'

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (d) => {
    setEditing(d)
    setForm({ name:d.name, type:d.type||'', status:d.status||'normal', site_id:d.site_id||'', assigned_to:d.assigned_to||'', reg_no:d.reg_no||'', inspect_expiry:d.inspect_expiry?.slice(0,10)||'', description:d.description||'' })
    setModal(true)
  }

  async function handleSave() {
    if (!form.name) { show('Vui lòng nhập tên thiết bị', 'info'); return }
    try {
      const data = { ...form, reg_no: isThuy ? null : form.reg_no||null, inspect_expiry: isThuy ? null : form.inspect_expiry||null }
      editing ? await api.put(`/devices/${editing.id}`, data) : await api.post('/devices', data)
      show(editing ? 'Đã cập nhật' : 'Đã thêm thiết bị', 'success')
      setModal(false); load()
    } catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  async function handleDelete(d) {
    if (!confirm(`Xóa thiết bị "${d.name}"?`)) return
    try { await api.delete(`/devices/${d.id}`); load() }
    catch (err) { show(err.response?.data?.error || 'Lỗi', 'info') }
  }

  // ── Nhập từ Excel ────────────────────────────────────────────
  function buildColMap(headerRow) {
    const map = {}
    headerRow.forEach((cell, idx) => {
      const h = norm(cell).toLowerCase()
      for (const [key, test] of HEADER_MATCHERS) {
        if (map[key] === undefined && test(h)) { map[key] = idx; break }
      }
    })
    return map
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const XLSX = await import('xlsx')   // tải thư viện chỉ khi thực sự nhập file
      const wb  = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const ws  = wb.Sheets[wb.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false, blankrows: false })
      if (aoa.length < 2) return show('File không có dữ liệu', 'info')

      const col = buildColMap(aoa[0])
      if (col.name === undefined) return show('Không tìm thấy cột "Tên thiết bị" trong file', 'info')

      const siteByName = new Map(sites.map(s => [norm(s.name).toLowerCase(), s]))
      const userByName = new Map(users.map(u => [norm(u.name).toLowerCase(), u]))

      const rows = []
      for (let r = 1; r < aoa.length; r++) {
        const get = k => col[k] === undefined ? '' : norm(aoa[r][col[k]])
        const name = get('name'), siteName = get('site'), assignName = get('assign')
        // bỏ qua dòng trống hoàn toàn
        if (![name, get('type'), siteName, assignName, get('reg_no'), get('inspect'), get('desc')].some(v => v)) continue

        const errors = []
        let site_id = null, siteType = null, assigned_to = null
        if (!name) errors.push('Thiếu tên thiết bị')
        if (siteName) {
          const s = siteByName.get(siteName.toLowerCase())
          if (!s) errors.push(`Công trường "${siteName}" không tồn tại`)
          else { site_id = s.id; siteType = s.type }
        }
        if (assignName) {
          const u = userByName.get(assignName.toLowerCase())
          if (!u) errors.push(`Không tìm thấy người "${assignName}"`)
          else assigned_to = u.id
        }
        const isThuy = siteType === 'Phương tiện thủy'
        const reg_no  = isThuy ? '' : get('reg_no')
        const inspect = isThuy ? '' : get('inspect')
        if (inspect && (!DATE_RE.test(inspect) || isNaN(Date.parse(inspect))))
          errors.push('Hạn đăng kiểm phải dạng YYYY-MM-DD hợp lệ')

        rows.push({
          excelRow: r + 1, name, siteName, assignName, errors,
          resolved: { name, type: get('type'), status: 'normal', site_id, assigned_to,
                      reg_no: reg_no || null, inspect_expiry: inspect || null, description: get('desc') },
        })
      }
      if (rows.length === 0) return show('File không có dòng dữ liệu nào', 'info')
      setImportRows(rows)
    } catch (err) {
      show('Không đọc được file: ' + err.message, 'info')
    } finally {
      e.target.value = ''   // cho phép chọn lại cùng file sau khi sửa
    }
  }

  async function handleImport() {
    const valid = importRows.filter(r => r.errors.length === 0)
    setImporting(true)
    try {
      await api.post('/devices/bulk', { devices: valid.map(r => r.resolved) })
      show(`Đã nhập ${valid.length} thiết bị`, 'success')
      setImportRows(null); load()
    } catch (err) {
      show(err.response?.data?.error || 'Lỗi khi nhập', 'info')
    } finally { setImporting(false) }
  }

  function downloadTemplate() {
    const headers = ['Tên thiết bị','Loại thiết bị','Công trường','Phân công cho','Số đăng ký','Hạn đăng kiểm (YYYY-MM-DD)','Mô tả']
    const sample  = ['Máy phát điện 1','Máy phát', sites[0]?.name || '', users[0]?.name || '', '', '', 'Công suất 200kVA']
    const csv = '﻿' + [headers, sample]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'mau_nhap_thiet_bi.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = devices.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.site_name?.toLowerCase().includes(search.toLowerCase()))

  const grouped = filtered.reduce((acc, d) => {
    const k = d.site_id || '__none__'
    if (!acc[k]) acc[k] = { name: d.site_name||'Chưa có công trường', devices: [] }
    acc[k].devices.push(d)
    return acc
  }, {})

  return (
    <div>
      <div className="page-title">Quản lý thiết bị</div>
      <div className="page-sub">{devices.length} thiết bị</div>
      <Alert message={alert.message} type={alert.type} onClose={hide} />

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm thiết bị</button>
        <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>Nhập từ Excel</button>
        <button className="btn btn-outline" onClick={downloadTemplate}>Tải mẫu</button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={handleFile} />
        <input className="form-ctrl" style={{ maxWidth:280 }} placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {Object.entries(grouped).map(([key, g]) => {
        const isOpen  = !collapsed[key]
        const broken  = g.devices.filter(d => d.has_open_ticket).length
        return (
          <div key={key} style={{ marginBottom:10, maxWidth:720 }}>
            <div
              onClick={() => toggleGroup(key)}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px', borderRadius: isOpen ? '12px 12px 0 0' : 12,
                background:'#1e3a5f', color:'#fff', cursor:'pointer', userSelect:'none',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{g.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, opacity:.7 }}>{g.devices.length} thiết bị</span>
                {broken > 0 && (
                  <span style={{ fontSize:11, background:'#ef4444', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{broken} sự cố</span>
                )}
                <span style={{ fontSize:16, opacity:.8, display:'inline-block', transition:'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ border:'1.5px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
                {g.devices.map((d, idx) => (
                  <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#fff', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#1e293b' }}>{d.name} {d.reg_no && <span style={{ fontSize:11, color:'#64748b', fontWeight:400 }}>({d.reg_no})</span>}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{d.type} · {d.assigned_name || 'Chưa phân công'}</div>
                      {d.description && <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{d.description}</div>}
                      {d.inspect_expiry && <div style={{ marginTop:4 }}><InspectBadge date={d.inspect_expiry} /></div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <StatusBadge device={d} />
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>Sửa</button>
                      <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5' }} onClick={() => handleDelete(d)}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Modal open={modal} title={editing ? 'Sửa thiết bị' : 'Thêm thiết bị'} onClose={() => setModal(false)} width={500}>
        <div style={{ marginBottom:10 }}>
          <label className="form-label">Tên thiết bị *</label>
          <input className="form-ctrl" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label className="form-label">Loại thiết bị</label>
            <input className="form-ctrl" value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))} placeholder="VD: Máy khoan" />
          </div>
          <div>
            <label className="form-label">Trạng thái</label>
            <select className="form-ctrl" value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))}>
              {STATUS_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label className="form-label">Công trường</label>
            <select className="form-ctrl" value={form.site_id} onChange={e => setForm(f => ({...f, site_id:e.target.value}))}>
              <option value="">-- Chưa có --</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Phân công cho</label>
            <select className="form-ctrl" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to:e.target.value}))}>
              <option value="">-- Chưa phân công --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        {!isThuy && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label className="form-label">Số đăng ký</label>
              <input className="form-ctrl" value={form.reg_no} onChange={e => setForm(f => ({...f, reg_no:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Hạn đăng kiểm</label>
              <input type="date" className="form-ctrl" value={form.inspect_expiry} onChange={e => setForm(f => ({...f, inspect_expiry:e.target.value}))} />
            </div>
          </div>
        )}
        <div style={{ marginBottom:16 }}>
          <label className="form-label">Mô tả / Đặc điểm</label>
          <textarea className="form-ctrl" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} placeholder="VD: Công suất 200kVA..." />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Lưu thay đổi' : 'Thêm thiết bị'}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
        </div>
      </Modal>

      <Modal open={!!importRows} title="Xem trước nhập từ Excel" onClose={() => setImportRows(null)} width={760}>
        {importRows && (() => {
          const errCount = importRows.filter(r => r.errors.length).length
          const okCount  = importRows.length - errCount
          return (
            <div>
              <div style={{ marginBottom:12, fontSize:13 }}>
                Tổng <b>{importRows.length}</b> dòng — <span style={{ color:'#16a34a' }}>{okCount} hợp lệ</span>
                {errCount > 0 && <span style={{ color:'#dc2626' }}> · {errCount} lỗi</span>}
              </div>
              <div style={{ maxHeight:'50vh', overflow:'auto', border:'1px solid #e2e8f0', borderRadius:8 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'#f1f5f9' }}>
                      <th style={th}>Dòng</th><th style={th}>Tên</th><th style={th}>Công trường</th>
                      <th style={th}>Phân công</th><th style={th}>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((r, i) => {
                      const ok = r.errors.length === 0
                      return (
                        <tr key={i} style={{ background: ok ? '#fff' : '#fef2f2' }}>
                          <td style={td}>{r.excelRow}</td>
                          <td style={td}>{r.name || <i style={{ color:'#dc2626' }}>(trống)</i>}</td>
                          <td style={td}>{r.siteName || '—'}</td>
                          <td style={td}>{r.assignName || '—'}</td>
                          <td style={{ ...td, color: ok ? '#16a34a' : '#dc2626' }}>{ok ? '✓ OK' : r.errors.join('; ')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:16, alignItems:'center', flexWrap:'wrap' }}>
                <button className="btn btn-primary" disabled={errCount > 0 || importing} onClick={handleImport}>
                  {importing ? 'Đang nhập...' : `Nhập ${okCount} thiết bị`}
                </button>
                <button className="btn btn-outline" onClick={() => setImportRows(null)}>Hủy</button>
                {errCount > 0 && <span style={{ fontSize:12, color:'#dc2626' }}>Sửa {errCount} dòng lỗi trong file rồi tải lên lại</span>}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
