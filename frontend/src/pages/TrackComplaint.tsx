import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getComplaint } from '../api/complaints'
import { StatusTimeline } from '../components/StatusTimeline'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import { useComplaintSocket } from '../hooks/useWebSocket'
import type { Complaint } from '../types'
import { ArrowLeft, Wifi } from 'lucide-react'

export default function TrackComplaint() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [manualId, setManualId] = useState(ticketId || '')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const liveUpdate = useComplaintSocket(complaint?.ticket_id || null)

  useEffect(() => {
    if (ticketId) fetchComplaint(ticketId)
  }, [ticketId])

  useEffect(() => {
    if (liveUpdate && complaint) {
      setComplaint((prev) => prev ? { ...prev, status: liveUpdate.status as Complaint['status'] } : prev)
    }
  }, [liveUpdate])

  const fetchComplaint = async (id: string) => {
    setError('')
    try {
      const data = await getComplaint(id)
      setComplaint(data)
    } catch {
      setError('Complaint not found. Check your ticket ID.')
      setComplaint(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-slate-900">Track Complaint</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="GRV-2025-00042"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            onClick={() => fetchComplaint(manualId)}
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
          >
            Track
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {complaint && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-slate-500">{complaint.ticket_id}</p>
                <p className="font-semibold text-slate-900 mt-0.5">{complaint.text.slice(0, 80)}{complaint.text.length > 80 ? '…' : ''}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Wifi size={12} /> Live
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              {complaint.severity && <SeverityBadge severity={complaint.severity} />}
              {complaint.category && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{complaint.category}</span>
              )}
              {complaint.is_overdue && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Overdue</span>
              )}
            </div>

            {complaint.sla_deadline && (
              <p className="text-xs text-slate-500">
                SLA deadline: <span className={complaint.is_overdue ? 'text-red-600 font-medium' : 'text-slate-700'}>
                  {new Date(complaint.sla_deadline).toLocaleString()}
                </span>
              </p>
            )}

            {complaint.resolution_note && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-xs font-medium text-green-800">Resolution Note</p>
                <p className="text-xs text-green-700 mt-0.5">{complaint.resolution_note}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Activity Timeline</h3>
              <StatusTimeline events={complaint.events} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
