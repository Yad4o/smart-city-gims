import api from './client'
import type { Complaint, Analytics } from '../types'

export const submitComplaint = (data: { text: string; lat?: number; lon?: number; address?: string }) =>
  api.post<Complaint>('/complaints', data).then((r) => r.data)

export const getComplaint = (ticketId: string) =>
  api.get<Complaint>(`/complaints/${ticketId}`).then((r) => r.data)

export const listComplaints = (params?: { status?: string; category?: string }) =>
  api.get<Complaint[]>('/complaints', { params }).then((r) => r.data)

export const updateStatus = (ticketId: string, status: string, note?: string) =>
  api.patch<Complaint>(`/complaints/${ticketId}/status`, { status, note }).then((r) => r.data)

export const getAnalytics = () =>
  api.get<Analytics>('/analytics').then((r) => r.data)

export const loginUser = (email: string, password: string) =>
  api.post<{ access_token: string }>('/auth/login', { email, password }).then((r) => r.data)

export const registerUser = (email: string, full_name: string, password: string) =>
  api.post('/auth/register', { email, full_name, password }).then((r) => r.data)

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data)
