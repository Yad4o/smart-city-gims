import { FileX, RefreshCw } from 'lucide-react'

interface Props {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <FileX size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          <RefreshCw size={12} /> {action.label}
        </button>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <FileX size={22} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">Something went wrong</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          <RefreshCw size={12} /> Try again
        </button>
      )}
    </div>
  )
}
