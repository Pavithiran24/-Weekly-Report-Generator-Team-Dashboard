export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyle = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 focus:ring-blue-500',
    secondary: 'glass text-white hover:text-white border border-white/10 hover:border-white/20 focus:ring-white/30',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-500/25 focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-white/5 text-dark-300 hover:text-white focus:ring-white/20',
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
