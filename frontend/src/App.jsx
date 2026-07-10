import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/Layout/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import MemberDashboard from './pages/member/MemberDashboard'
import CreateReport from './pages/member/CreateReport'
import EditReport from './pages/member/EditReport'
import ReportHistory from './pages/member/ReportHistory'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import AllReports from './pages/manager/AllReports'
import Projects from './pages/manager/Projects'
import Analytics from './pages/manager/Analytics'
import Profile from './pages/Profile'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Member routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute role="member"><MemberDashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/reports/create" element={
            <ProtectedRoute role="member"><CreateReport /></ProtectedRoute>
          } />
          <Route path="/reports/:id/edit" element={
            <ProtectedRoute role="member"><EditReport /></ProtectedRoute>
          } />
          <Route path="/reports/history" element={
            <ProtectedRoute role="member"><ReportHistory /></ProtectedRoute>
          } />

          {/* Manager routes */}
          <Route path="/manager/dashboard" element={
            <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>
          } />
          <Route path="/manager/reports" element={
            <ProtectedRoute role="manager"><AllReports /></ProtectedRoute>
          } />
          <Route path="/manager/projects" element={
            <ProtectedRoute role="manager"><Projects /></ProtectedRoute>
          } />
          <Route path="/manager/analytics" element={
            <ProtectedRoute role="manager"><Analytics /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
