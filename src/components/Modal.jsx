export default function Modal({ open, title, onClose, children, width = 460 }) {
  if (!open) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
      zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card card-p4" style={{ width, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
        {title && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="sec-title">{title}</div>
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94a3b8' }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
