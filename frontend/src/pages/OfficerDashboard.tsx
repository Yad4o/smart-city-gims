import { useState, useEffect } from 'react'
import { listComplaints, updateStatus } from '../api/complaints'
import { ComplaintCard } from '../components/ComplaintCard'
import { StatusTimeline } from '../components/StatusTimeline'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import type { Complaint, ComplaintStatus } from '../types'

const STATUS_OPTIONS: ComplaintStatus[] = ['assigned', 'in_progress', 'resolved', 'closed']

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('in_progress')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    listComplaints().then(setComplaints).catch(() => {})
  }, [])

  const handleUpdate = async () => {
    if (!selected) return
    setUpdating(true)
    try {
      const updated = await updateStatus(selected.ticket_id, newStatus, note)
      setComplaints((prev) => prev.map((c) => c.ticket_id === updated.ticket_id ? updated : c))
      setSelected(updated)
      setNote('')
    } catch {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const filtered = filter
    ? complaints.filter((c) => c.status === filter)
    : complaints

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">{complaints.length} assigned complaints</p>
        </div>
        <div className="p-3 border-b border-slate-200">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      </aside>

      {/* Detail panel */}
      <main className="flex-1 p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Select a complaint to view details
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-500">{selected.ticket_id}</span>
                <StatusBadge status={selected.status} />
                {selected.severity && <SeverityBadge severity={selected.severity} />}
                {selected.is_overdue && (
                  <span className="text-xs text-red-600 font-medium">Overdue</span>
                )}
              </div>
              <p className="text-slate-800 text-sm mt-2">{selected.text}</p>
              {selected.address && <p className="text-xs text-slate-500 mt-1">{selected.address}</p>}
              {selected.sla_deadline && (
                <p className="text-xs text-slate-400 mt-1">
                  SLA: {new Date(selected.sla_deadline).toLocaleString()}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Update Status</h3>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none resize-none"
              />
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Timeline</h3>
              <StatusTimeline events={selected.events} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
