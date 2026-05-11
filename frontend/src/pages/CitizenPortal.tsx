import { useState, useEffect, useCallback } from 'react'
import { submitComplaint, listComplaints } from '../api/complaints'
import { ComplaintCard } from '../components/ComplaintCard'
import { ComplaintCardSkeleton } from '../components/Skeleton'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { toast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import type { Complaint } from '../types'
import { MapPin, Send, Loader2, LogOut, ClipboardList } from 'lucide-react'

const MAX_CHARS = 500

export default function CitizenPortal() {
  const [text, setText] = useState('')
  const [address, setAddress] = useState('')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState<Complaint | null>(null)
  const navigate = useNavigate()

  const loadComplaints = useCallback(async () => {
    setLoadingList(true)
    setListError('')
    try {
      const data = await listComplaints()
      setComplaints(data)
    } catch {
      setListError('Failed to load your complaints.')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { loadComplaints() }, [loadComplaints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim().length < 10) {
      setSubmitError('Please describe the issue in at least 10 characters.')
      return
    }
    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await submitComplaint({ text: text.trim(), address: address.trim() || undefined })
      setSubmitted(result)
      setText('')
      setAddress('')
      setComplaints((prev) => [result, ...prev])
      toast('Complaint submitted successfully', 'success')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) setSubmitError('Your session expired. Please log in again.')
      else if (status === 422) setSubmitError('Invalid input. Please check your details.')
      else setSubmitError('Failed to submit. Check your network and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm">Smart City GIMS</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/track')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 transition"
          >
            <ClipboardList size={14} /> Track complaint
          </button>
          <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 transition">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Success banner */}
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800">Complaint submitted</p>
                <p className="text-xs text-green-700 mt-1">
                  Ticket <strong className="font-mono">{submitted.ticket_id}</strong>
                  {submitted.category && <> · {submitted.category}</>}
                  {submitted.severity && <> · Priority {submitted.severity}</>}
                </p>
                {submitted.sla_deadline && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Expected resolution by {new Date(submitted.sla_deadline).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(`/track/${submitted.ticket_id}`)}
                className="text-xs text-green-700 font-medium hover:underline shrink-0 ml-4"
              >
                Track &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Submit form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Report an Issue</h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Describe the issue</label>
                <span className={`text-xs ${text.length > MAX_CHARS * 0.9 ? 'text-red-500' : 'text-slate-400'}`}>
                  {text.length}/{MAX_CHARS}
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                rows={4}
                placeholder="e.g. There is a large pothole on MG Road near the bus stop causing accidents..."
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 transition resize-none ${
                  submitError && text.length < 10
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                <MapPin size={12} className="text-slate-400" /> Address
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street / Area / Landmark"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-xs text-red-700">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || text.trim().length < 10}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        {/* Complaints list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">My Complaints</h2>
            {complaints.length > 0 && (
              <span className="text-xs text-slate-400">{complaints.length} total</span>
            )}
          </div>

          {loadingList ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <ComplaintCardSkeleton key={i} />)}
            </div>
          ) : listError ? (
            <ErrorState message={listError} onRetry={loadComplaints} />
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No complaints yet"
              description="Submit your first complaint using the form above."
            />
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  onClick={() => navigate(`/track/${c.ticket_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
