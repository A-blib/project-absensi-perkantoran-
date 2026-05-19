const statusStyles = {
  hadir: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  telat: "bg-amber-50 text-amber-700 ring-amber-200",
  izin: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  alpa: "bg-red-50 text-red-700 ring-red-200",
  default: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function Badge({ status = "default", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status] || statusStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
