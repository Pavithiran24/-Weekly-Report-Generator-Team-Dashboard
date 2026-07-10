import { useEffect, useRef } from 'react'
import { X, Sparkles } from 'lucide-react'
import Card from './Card'

export default function WelcomePopup({ open, onClose }) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const timer = window.setTimeout(() => {
      onCloseRef.current()
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close welcome popup"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-slate-950/70 backdrop-blur-sm"
      />

      <div className="welcome-popup-panel relative z-10 w-full max-w-2xl">
        <Card className="relative overflow-hidden border border-white/10 bg-slate-950/96 p-0 shadow-2xl shadow-black/50">
          <div className="welcome-popup-line absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="welcome-popup-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">✨ Welcome!</p>
                <h2 className="welcome-popup-name mt-1 text-xl font-bold drop-shadow-[0_0_18px_rgba(255,255,255,0.18)] sm:text-2xl">
                  Hello, I&apos;m Pavithiran Thevarasa.
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-dark-300 transition-colors hover:text-white"
              aria-label="Dismiss welcome popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 p-6 text-sm leading-7 text-dark-200 sm:p-7">
            <p>
              Thank you for the opportunity to present my solution. This project represents my passion for software
              engineering and my commitment to building clean, intuitive, and reliable applications.
            </p>
            <p>
              I truly appreciate your time, attention, and feedback. I hope this project gives you a clear look at my
              skills, my design choices, and my focus on creating a polished user experience.
            </p>
            <p>
              Enjoy exploring the project, and thank you again for the opportunity to share it with you.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}