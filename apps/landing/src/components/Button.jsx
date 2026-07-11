import { Link } from "react-router-dom";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700",
  outline: "border-2 border-blue-200 text-blue-700 hover:border-blue-600 bg-transparent",
  ghost: "text-slate-500 hover:text-blue-700 hover:bg-blue-50",
  red: "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25",
};

export default function Button({ children, to, variant = "primary", className = "", onClick, type = "button" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5";
  const cls = `${base} ${variants[variant] ?? variants.primary} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} className={cls}>{children}</button>;
}
