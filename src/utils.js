export const ROLE_LABEL = {
  tech:           'Nhân viên kỹ thuật',
  specialist:     'Chuyên viên cơ điện',
  deputy_manager: 'Phó phòng kỹ thuật cơ điện',
  manager:        'Trưởng phòng KT cơ điện',
  director:       'Phó Tổng Giám Đốc',
  admin:          'Quản trị viên',
}

export const TECH_ROLES = ['tech', 'specialist', 'deputy_manager']

export function isTechRole(role)    { return TECH_ROLES.includes(role) }
export function isManagerRole(role) { return role === 'manager' }

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function monthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return `Tháng ${m}/${y}`
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join('')
}

export function inspectStatus(isoDate) {
  if (!isoDate) return null
  const days = Math.ceil((new Date(isoDate) - new Date()) / 86400000)
  if (days < 0)   return { type: 'expired', label: `Hết hạn ĐK ${fmtDate(isoDate)}`,       color: 'red' }
  if (days <= 30) return { type: 'soon',    label: `ĐK còn ${days} ngày (${fmtDate(isoDate)})`, color: 'yellow' }
  return               { type: 'ok',      label: `ĐK đến ${fmtDate(isoDate)}`,             color: 'green' }
}

export function getDeviceStatus(device) {
  if (device.has_open_ticket) return 'broken'
  return device.status || 'normal'
}

export const STATUS_LABEL = {
  normal:  'Bình thường', broken: 'Lỗi',
  maintain:'Đang bảo trì', pending:'Chờ linh kiện',
}

export const TICKET_STATUS_LABEL = {
  pending:     'Chờ phê duyệt',
  in_progress: 'Đang thực hiện',
  resolved:    'Đã khắc phục',
}
