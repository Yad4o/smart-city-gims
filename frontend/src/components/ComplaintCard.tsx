import type { Complaint } from '../types'
import { StatusBadge, SeverityBadge } from './StatusBadge'
import { AlertTriangle } from 'lucide-react'

interface Props {
  complaint: Complaint
  onClick?: () => void
}

export function ComplaintCard({ complaint, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-slate-500">{complaint.ticket_id}</span>
        <div className="flex gap-2">
          {complaint.severity && <SeverityBadge severity={complaint.severity} />}
          <StatusBadge status={complaint.status} />
          {complaint.is_overdue && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertTriangle size={12} /> Overdue
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-700 line-clamp-2">{complaint.text}</p>
      <div className="mt-2 flex gap-3 text-xs text-slate-400">
        {complaint.category && <span>{complaint.category}</span>}
        {complaint.address && <span>{complaint.address}</span>}
        <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
