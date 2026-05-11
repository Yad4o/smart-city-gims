import { useState, useEffect, useCallback } from 'react'
import { listComplaints, updateStatus } from '../api/complaints'
import { ComplaintCard } from '../components/ComplaintCard'
import { ComplaintCardSkeleton } from '../components/Skeleton'
import { StatusTimeline } from '../components/StatusTimeline'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { toast } from '../components/Toast'
import type { Complaint, ComplaintStatus } from '../types'
import { LogOut, Loader2, AlertTriangle, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const STATUS_OPTIONS: ComplaintStatus[] = ['assigned', 'in_progress', 'resolved', 'closed']
const STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('in_progress')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [filter, setFilter] = useState('')
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await listComplaints()
      setComplaints(data)
    } catch {
      setLoadError('Failed to load complaints. Check your network.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadComplaints() }, [loadComplaints])

  const handleUpdate = async () => {
    if (!selected) return
    setUpdateError('')
    setUpdating(true)
    try {
      const updated = await updateStatus(selected.ticket_id, newStatus, note || undefined)
      setComplaints((prev) => prev.map((c) => c.ticket_id === updated.ticket_id ? updated : c))
      setSelected(updated)
      setNote('')
      toast(`Status updated to "${STATUS_LABELS[newStatus]}"`, 'success')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) setUpdateError('You are not authorised to update this complaint.')
      else if (status === 404) setUpdateError('Complaint not found.')
      else setUpdateError('Failed to update. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !e.target.files?.[0]) return
    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) { toast('File must be under 5 MB', 'error'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/complaints/${selected.ticket_id}/photo`, form)
      setSelected((prev) => prev ? { ...prev, photo_url: res.data.photo_url } : prev)
      toast('Photo uploaded successfully', 'success')
    } catch {
      toast('Failed to upload photo', 'error')
    } finally {
      setUploading(false)
    }
  }

  const overdueCount = complaints.filter((c) => c.is_overdue).length
  const filtered = filter ? complaints.filter((c) => c.status === filter) : complaints

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = complaints.filter((c) => c.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-900 text-sm">Officer Dashboard</h1>
            <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-slate-400 hover:text-slate-600">
              <LogOut size={15} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">{complaints.length} total</span>
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle size={11} /> {overdueCount} overdue
              </span>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="px-3 pt-3 pb-2 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setFilter('')}
            className={`text-xs rounded-lg px-2 py-1.5 font-medium transition ${!filter ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All ({complaints.length})
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs rounded-lg px-2 py-1.5 font-medium transition ${filter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {STATUS_LABELS[s]} ({statusCounts[s] || 0})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            [0, 1, 2, 3].map((i) => <ComplaintCardSkeleton key={i} />)
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={loadComplaints} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No complaints" description={filter ? `No ${STATUS_LABELS[filter]?.toLowerCase()} complaints.` : 'Nothing assigned yet.'} />
          ) : (
            filtered.map((c) => (
              <div key={c.id} className={`rounded-xl transition ${selected?.id === c.id ? 'ring-2 ring-brand-500' : ''}`}>
                <ComplaintCard complaint={c} onClick={() => { setSelected(c); setUpdateError('') }} />
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Detail panel */}
      <main className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Select a complaint to view details</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-5">
            {/* Complaint detail */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-mono text-slate-400">{selected.ticket_id}</span>
                <StatusBadge status={selected.status} />
                {selected.severity && <SeverityBadge severity={selected.severity} />}
                {selected.is_overdue && (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                    <AlertTriangle size={11} /> Overdue
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">{selected.text}</p>
              <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
                {selected.address && <p>{selected.address}</p>}
                {selected.sla_deadline && (
                  <p className={selected.is_overdue ? 'text-red-600 font-medium' : ''}>
                    SLA deadline: {new Date(selected.sla_deadline).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Update status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Update Status</h3>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={`text-xs rounded-lg px-3 py-2 font-medium border transition ${
                      newStatus === s
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-400'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a resolution note or update (optional)"
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition resize-none"
              />

              {updateError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-xs text-red-700">{updateError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition"
                >
                  {updating && <Loader2 size={14} className="animate-spin" />}
                  {updating ? 'Updating…' : 'Update Status'}
                </button>

                <label className={`flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-brand-600 cursor-pointer transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? 'Uploading…' : 'Upload photo proof'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            {/* Photo proof */}
            {selected.photo_url && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Photo Proof</h3>
                <img src={selected.photo_url} alt="Proof" className="rounded-xl max-h-56 object-cover border border-slate-200" />
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-4">Activity Timeline</h3>
              {selected.events.length === 0 ? (
                <p className="text-xs text-slate-400">No events recorded.</p>
              ) : (
                <StatusTimeline events={selected.events} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
