import { useState, useEffect } from 'react'
import { submitComplaint, listComplaints } from '../api/complaints'
import { ComplaintCard } from '../components/ComplaintCard'
import { useNavigate } from 'react-router-dom'
import type { Complaint } from '../types'
import { MapPin, Send } from 'lucide-react'

export default function CitizenPortal() {
  const [text, setText] = useState('')
  const [address, setAddress] = useState('')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<Complaint | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    listComplaints().then(setComplaints).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await submitComplaint({ text, address })
      setSubmitted(result)
      setText('')
      setAddress('')
      setComplaints((prev) => [result, ...prev])
    } catch {
      alert('Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-slate-900">Smart City GIMS</h1>
        <button onClick={() => navigate('/track')} className="text-sm text-brand-600 hover:underline">
          Track a complaint
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800">Complaint submitted successfully</p>
            <p className="text-xs text-green-700 mt-1">
              Ticket ID: <strong>{submitted.ticket_id}</strong> — Category: {submitted.category} — Priority: {submitted.severity}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              SLA deadline: {submitted.sla_deadline ? new Date(submitted.sla_deadline).toLocaleString() : 'N/A'}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Submit a Complaint</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Describe the issue</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={4}
                placeholder="e.g. There is a large pothole on MG Road near the bus stop..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <MapPin size={12} /> Address (optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street / Area / Landmark"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              <Send size={14} />
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 mb-3">My Complaints</h2>
          <div className="space-y-3">
            {complaints.length === 0 && (
              <p className="text-sm text-slate-400">No complaints submitted yet.</p>
            )}
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} onClick={() => navigate(`/track/${c.ticket_id}`)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
