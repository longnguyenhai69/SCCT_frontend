import { useState, useEffect } from 'react'

export default function Alert({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div className={type === 'success' ? 'alert-success' : 'alert-info'}>
      {type === 'success' ? '✓' : 'ℹ'} {message}
    </div>
  )
}

export function useAlert() {
  const [alert, setAlert] = useState({ message: '', type: 'info' })
  const show = (message, type = 'info') => setAlert({ message, type })
  const hide = () => setAlert({ message: '', type: 'info' })
  return { alert, show, hide }
}
