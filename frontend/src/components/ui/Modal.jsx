import { X } from 'lucide-react';
import Card from './Card';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg">
        <Card className="!p-0 overflow-hidden rounded-t-3xl sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button type="button" onClick={onClose} className="text-dark-300 transition-colors hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="bg-slate-900/80 p-4">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
}
