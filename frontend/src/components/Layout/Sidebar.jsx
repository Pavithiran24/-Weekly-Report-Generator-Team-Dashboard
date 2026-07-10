import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Clock,
  FolderKanban,
  BarChart3,
  ChevronRight,
  UserCircle2,
  X,
} from 'lucide-react'

const memberLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reports/create', icon: PlusCircle, label: 'New Report' },
  { to: '/reports/history', icon: Clock, label: 'Report History' },
  { to: '/profile', icon: UserCircle2, label: 'Profile' },
]

const managerLinks = [
  { to: '/manager/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/manager/reports', icon: FileText, label: 'All Reports' },
  { to: '/manager/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: UserCircle2, label: 'Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const links = user?.role === 'manager' ? managerLinks : memberLinks

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] -translate-x-full flex-col shrink-0 border-r border-white/10 glass shadow-2xl shadow-slate-950/40 transition-transform duration-300 ease-out md:sticky md:top-0 md:z-auto md:w-64 md:max-w-none md:translate-x-0 ${isOpen ? 'translate-x-0' : ''}`}
    >
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-dark-300 transition-colors hover:text-white md:hidden"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Logo */}
      <div className="border-b border-white/10 p-6 pr-14 md:pr-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">WeeklyReport</h1>
            <p className="text-dark-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-dark-400">
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 p-4">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-dark-300 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
