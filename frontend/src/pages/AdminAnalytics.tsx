import { useState, useEffect } from 'react'
import { getAnalytics } from '../api/complaints'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { Analytics } from '../types'

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

export default function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAnalytics().then(setData).catch(() => setError('Failed to load analytics. Admin access required.'))
  }, [])

  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>
  if (!data) return <div className="p-8 text-sm text-slate-500">Loading analytics...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Complaints', value: data.total_complaints, color: 'text-slate-900' },
          { label: 'Resolved Today', value: data.resolved_today, color: 'text-green-700' },
          { label: 'SLA Breach Rate', value: `${(data.sla_breach_rate * 100).toFixed(1)}%`, color: data.sla_breach_rate > 0.1 ? 'text-red-600' : 'text-green-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* By category */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Resolution Rate by Category</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.by_category}>
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
            <Bar dataKey="resolution_rate" name="Resolution Rate" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SLA breach by ward + officer table */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">SLA Breach by Ward</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.by_ward} dataKey="breached" nameKey="ward_name" cx="50%" cy="50%" outerRadius={70} label>
                {data.by_ward.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 overflow-auto">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Officer Performance</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-100">
                <th className="pb-2">Officer</th>
                <th className="pb-2">Assigned</th>
                <th className="pb-2">Resolved</th>
                <th className="pb-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.officer_performance.map((o) => (
                <tr key={o.officer_id} className="border-b border-slate-50">
                  <td className="py-1.5">{o.officer_name}</td>
                  <td>{o.assigned}</td>
                  <td>{o.resolved}</td>
                  <td>
                    <span className={`font-semibold ${o.performance_score >= 70 ? 'text-green-600' : o.performance_score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {o.performance_score}
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
