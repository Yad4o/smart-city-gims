import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import CitizenPortal from './pages/CitizenPortal'
import TrackComplaint from './pages/TrackComplaint'
import OfficerDashboard from './pages/OfficerDashboard'
import AdminAnalytics from './pages/AdminAnalytics'
import './index.css'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><CitizenPortal /></PrivateRoute>} />
        <Route path="/track" element={<PrivateRoute><TrackComplaint /></PrivateRoute>} />
        <Route path="/track/:ticketId" element={<PrivateRoute><TrackComplaint /></PrivateRoute>} />
        <Route path="/officer" element={<PrivateRoute><OfficerDashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminAnalytics /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
