import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/60 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main key={location.pathname} className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
