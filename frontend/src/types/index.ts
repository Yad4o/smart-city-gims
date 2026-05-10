export type UserRole = 'citizen' | 'officer' | 'admin'
export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'escalated'
export type Category = 'Road' | 'Water' | 'Electricity' | 'Sanitation' | 'Safety' | 'Other'
export type Severity = 'P1' | 'P2' | 'P3' | 'P4'
export type Channel = 'api' | 'email' | 'whatsapp'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  department?: string
  ward_id?: number
  current_load: number
}

export interface ComplaintEvent {
  event_type: string
  note?: string
  timestamp: string
  actor_id?: number
}

export interface Complaint {
  id: number
  ticket_id: string
  text: string
  category?: Category
  severity?: Severity
  status: ComplaintStatus
  lat?: number
  lon?: number
  address?: string
  ward_id?: number
  officer_id?: number
  sla_deadline?: string
  is_overdue: boolean
  photo_url?: string
  resolution_note?: string
  channel: Channel
  created_at: string
  events: ComplaintEvent[]
}

export interface CategoryStat {
  category: string
  total: number
  resolved: number
  resolution_rate: number
}

export interface WardSLAStat {
  ward_id: number
  ward_name: string
  total: number
  breached: number
  breach_rate: number
}

export interface OfficerStat {
  officer_id: number
  officer_name: string
  assigned: number
  resolved: number
  avg_resolution_hours: number
  performance_score: number
}

export interface Analytics {
  total_complaints: number
  resolved_today: number
  sla_breach_rate: number
  by_category: CategoryStat[]
  by_ward: WardSLAStat[]
  officer_performance: OfficerStat[]
}
