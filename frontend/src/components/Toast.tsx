import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

// Module-level store — no context needed
let _listeners: ((t: ToastItem[]) => void)[] = []
let _toasts: ToastItem[] = []

export function toast(message: string, type: ToastType = 'info') {
  const id = Date.now()
  _toasts = [..._toasts, { id, message, type }]
  _listeners.forEach((l) => l(_toasts))
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id)
    _listeners.forEach((l) => l(_toasts))
  }, 4000)
}

const ICONS = {
  success: <CheckCircle size={16} className="text-green-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
  info: <Info size={16} className="text-blue-500 shrink-0" />,
}

const BG = {
  success: 'border-green-100 bg-green-50',
  error: 'border-red-100 bg-red-50',
  info: 'border-blue-100 bg-blue-50',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    _listeners.push(setToasts)
    return () => { _listeners = _listeners.filter((l) => l !== setToasts) }
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up ${BG[t.type]}`}
        >
          {ICONS[t.type]}
          <p className="text-sm text-slate-700 flex-1">{t.message}</p>
          <button
            onClick={() => { _toasts = _toasts.filter((x) => x.id !== t.id); _listeners.forEach((l) => l(_toasts)) }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
