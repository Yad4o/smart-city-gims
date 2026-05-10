import { useEffect, useRef, useState } from 'react'

interface StatusUpdate {
  ticket_id: string
  status: string
  note?: string
}

export function useComplaintSocket(ticketId: string | null) {
  const [lastUpdate, setLastUpdate] = useState<StatusUpdate | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!ticketId) return
    const ws = new WebSocket(`ws://${window.location.host}/ws/complaints/ws/${ticketId}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        setLastUpdate(JSON.parse(e.data))
      } catch {}
    }
    return () => ws.close()
  }, [ticketId])

  return lastUpdate
}
