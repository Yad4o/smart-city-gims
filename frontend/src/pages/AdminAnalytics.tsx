import { useState, useEffect, useCallback } from 'react'
import { getAnalytics } from '../api/complaints'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { AnalyticsSkeleton } from '../components/Skeleton'
import { ErrorState } from '../components/EmptyState'
import { toast } from '../components/Toast'
import type { Analytics } from '../types'
import { RefreshCw, TrendingUp, TrendingDown, Minus, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

function KPICard({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      {trend && <TrendIcon size={18} className={trendColor} />}
    </div>
  )
}

export default function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const analytics = await getAnalytics()
      setData(analytics)
      if (showRefresh) toast('Analytics refreshed', 'success')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) setError('Admin access required to view analytics.')
      else if (status === 401) setError('Session expired. Please log in again.')
      else setError('Failed to load analytics. Check your network connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <AnalyticsSkeleton />

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <ErrorState message={error} onRetry={() => loadData()} />
    </div>
  )

  if (!data) return null

  const breachPercent = (data.sla_breach_rate * 100).toFixed(1)
  const categoryChartData = data.by_category.map((c) => ({
    ...c,
    resolution_pct: Math.round(c.resolution_rate * 100),
    total_minus_resolved: c.total - c.resolved,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-10">
        <span className="font-bold text-slate-900 text-sm">Analytics Dashboard</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-slate-400 hover:text-slate-600">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Total Complaints" value={data.total_complaints} trend="neutral" />
          <KPICard label="Resolved Today" value={data.resolved_today} trend="up" />
          <KPICard
            label="SLA Breach Rate"
            value={`${breachPercent}%`}
            trend={data.sla_breach_rate > 0.15 ? 'down' : data.sla_breach_rate < 0.05 ? 'up' : 'neutral'}
          />
        </div>

        {/* Category chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Complaints by Category</h2>
          <p className="text-xs text-slate-400 mb-4">Resolved vs. open breakdown</p>
          {data.by_category.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryChartData} barSize={28}>
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: number, name: string) => [v, name === 'resolved' ? 'Resolved' : 'Open']}
                />
                <Bar dataKey="resolved" name="resolved" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="total_minus_resolved" name="open" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* SLA breach pie */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">SLA Breaches by Ward</h2>
            <p className="text-xs text-slate-400 mb-4">Number of overdue complaints per ward</p>
            {data.by_ward.filter((w) => w.breached > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-xs text-slate-400 mt-1">No SLA breaches</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.by_ward.filter((w) => w.breached > 0)}
                    dataKey="breached"
                    nameKey="ward_name"
                    cx="50%" cy="50%"
                    outerRadius={72}
                    innerRadius={36}
                  >
                    {data.by_ward.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Officer table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">Officer Performance</h2>
            <p className="text-xs text-slate-400 mb-4">Score = resolved / assigned × 100</p>
            {data.officer_performance.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No officers assigned yet</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-medium text-left border-b border-slate-100">
                      <th className="pb-2 pr-3">Officer</th>
                      <th className="pb-2 text-center">Assigned</th>
                      <th className="pb-2 text-center">Resolved</th>
                      <th className="pb-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.officer_performance
                      .sort((a, b) => b.performance_score - a.performance_score)
                      .map((o) => (
                        <tr key={o.officer_id}>
                          <td className="py-2 pr-3 font-medium text-slate-700 truncate max-w-[120px]">{o.officer_name}</td>
                          <td className="py-2 text-center text-slate-500">{o.assigned}</td>
                          <td className="py-2 text-center text-slate-500">{o.resolved}</td>
                          <td className="py-2 text-right">
                            <span className={`font-bold ${
                              o.performance_score >= 70 ? 'text-green-600' :
                              o.performance_score >= 40 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              {o.performance_score}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Ward SLA table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">SLA Summary by Ward</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 font-medium text-left border-b border-slate-100">
                <th className="pb-2">Ward</th>
                <th className="pb-2 text-center">Total</th>
                <th className="pb-2 text-center">Breached</th>
                <th className="pb-2 text-right">Breach Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.by_ward.map((w) => (
                <tr key={w.ward_id}>
                  <td className="py-2 font-medium text-slate-700">{w.ward_name}</td>
                  <td className="py-2 text-center text-slate-500">{w.total}</td>
                  <td className="py-2 text-center text-slate-500">{w.breached}</td>
                  <td className="py-2 text-right">
                    <span className={w.breach_rate > 0.2 ? 'text-red-600 font-semibold' : w.breach_rate > 0.1 ? 'text-amber-500 font-medium' : 'text-green-600'}>
                      {(w.breach_rate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
