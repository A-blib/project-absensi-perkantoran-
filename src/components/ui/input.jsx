export function Input({ label, hint, className = "", ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className={`h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}
