import type { ComplaintStatus, Severity } from '../types'

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
  escalated: 'bg-red-100 text-red-700',
}

const SEVERITY_COLORS: Record<Severity, string> = {
  P1: 'bg-red-600 text-white',
  P2: 'bg-orange-500 text-white',
  P3: 'bg-yellow-400 text-black',
  P4: 'bg-slate-200 text-slate-600',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_COLORS[severity]}`}>
      {severity}
    </span>
  )
}
