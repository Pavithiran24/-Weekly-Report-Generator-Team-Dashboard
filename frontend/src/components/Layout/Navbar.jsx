import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="glass border-b border-white/10 px-4 py-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-dark-300 transition-colors hover:text-white md:hidden"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
        <h2 className="text-white font-semibold">
          Welcome back,{' '}
          <span className="gradient-text">{user?.name}</span>
        </h2>
        <p className="text-dark-300 text-xs mt-0.5">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-dark-300 hover:text-white transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
        </button>

        <button type="button" className="w-9 h-9 rounded-xl glass flex items-center justify-center text-dark-300 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        <button
          id="logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-dark-300 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
