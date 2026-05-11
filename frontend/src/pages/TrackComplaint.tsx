import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getComplaint } from '../api/complaints'
import { StatusTimeline } from '../components/StatusTimeline'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import { Skeleton } from '../components/Skeleton'
import { useComplaintSocket } from '../hooks/useWebSocket'
import { toast } from '../components/Toast'
import type { Complaint } from '../types'
import { ArrowLeft, Wifi, WifiOff, Copy, CheckCheck, Search, Loader2 } from 'lucide-react'

export default function TrackComplaint() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [manualId, setManualId] = useState(ticketId || '')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const liveUpdate = useComplaintSocket(complaint?.ticket_id || null)

  const fetchComplaint = useCallback(async (id: string) => {
    if (!id.trim()) { setError('Please enter a ticket ID.'); return }
    setLoading(true)
    setError('')
    setComplaint(null)
    try {
      const data = await getComplaint(id.trim().toUpperCase())
      setComplaint(data)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) setError(`No complaint found with ID "${id.trim()}". Check the ID and try again.`)
      else if (status === 403) setError('You do not have access to view this complaint.')
      else setError('Unable to fetch complaint. Check your network and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ticketId) { setManualId(ticketId); fetchComplaint(ticketId) }
  }, [ticketId, fetchComplaint])

  useEffect(() => {
    if (liveUpdate && complaint) {
      setComplaint((prev) =>
        prev ? { ...prev, status: liveUpdate.status as Complaint['status'] } : prev
      )
      toast(`Status updated: ${liveUpdate.status.replace('_', ' ')}`, 'info')
    }
  }, [liveUpdate])

  const copyTicketId = () => {
    if (!complaint) return
    navigator.clipboard.writeText(complaint.ticket_id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const slaColor = complaint?.is_overdue
    ? 'text-red-600 font-semibold'
    : complaint?.sla_deadline && new Date(complaint.sla_deadline).getTime() - Date.now() < 3_600_000
    ? 'text-orange-500 font-medium'
    : 'text-slate-600'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-700 transition">
          <ArrowLeft size={18} />
        </button>
        <span className="font-bold text-slate-900 text-sm">Track Complaint</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchComplaint(manualId)}
              placeholder="GRV-2025-00042"
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
            />
          </div>
          <button
            onClick={() => fetchComplaint(manualId)}
            disabled={loading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Track'}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !complaint && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-10 rounded" />
            </div>
            <Skeleton className="h-3 w-48" />
            <div className="space-y-3 pt-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </div>
        )}

        {/* Result */}
        {complaint && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-500">{complaint.ticket_id}</span>
                  <button onClick={copyTicketId} className="text-slate-400 hover:text-brand-600 transition">
                    {copied ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {complaint.text.slice(0, 100)}{complaint.text.length > 100 ? '…' : ''}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-xs shrink-0 ${liveUpdate ? 'text-green-600' : 'text-slate-400'}`}>
                {liveUpdate ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{liveUpdate ? 'Live' : 'Connected'}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              {complaint.severity && <SeverityBadge severity={complaint.severity} />}
              {complaint.category && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{complaint.category}</span>
              )}
              {complaint.is_overdue && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-semibold">Overdue</span>
              )}
            </div>

            {/* Address + SLA */}
            <div className="space-y-1 text-xs text-slate-500">
              {complaint.address && <p>{complaint.address}</p>}
              {complaint.sla_deadline && (
                <p>
                  Expected resolution by{' '}
                  <span className={slaColor}>{new Date(complaint.sla_deadline).toLocaleString()}</span>
                </p>
              )}
            </div>

            {/* Resolution note */}
            {complaint.resolution_note && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-green-800 mb-0.5">Resolution</p>
                <p className="text-xs text-green-700">{complaint.resolution_note}</p>
              </div>
            )}

            {/* Photo proof */}
            {complaint.photo_url && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Photo Proof</p>
                <img
                  src={complaint.photo_url}
                  alt="Resolution proof"
                  className="rounded-xl max-h-48 object-cover border border-slate-200"
                />
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Activity</h3>
              {complaint.events.length === 0 ? (
                <p className="text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                <StatusTimeline events={complaint.events} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
