export function Card({ className = "", children }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardContent({ className = "", children }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}
