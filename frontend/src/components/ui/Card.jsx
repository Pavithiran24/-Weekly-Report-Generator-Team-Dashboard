export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`
      glass-card shadow-xl
      ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
