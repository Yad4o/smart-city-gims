import type { ComplaintEvent } from '../types'

export function StatusTimeline({ events }: { events: ComplaintEvent[] }) {
  return (
    <ol className="relative border-l border-slate-200 ml-3">
      {events.map((e, i) => (
        <li key={i} className="mb-6 ml-6">
          <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500" />
          <p className="text-sm font-semibold text-slate-800 capitalize">{e.event_type.replace('_', ' ')}</p>
          {e.note && <p className="text-xs text-slate-500 mt-0.5">{e.note}</p>}
          <time className="text-xs text-slate-400">{new Date(e.timestamp).toLocaleString()}</time>
        </li>
      ))}
    </ol>
  )
}
