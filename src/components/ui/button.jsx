import Link from "next/link";
import { forwardRef } from "react";

const variants = {
  primary: "bg-[#3b82f6] text-white shadow-sm hover:bg-blue-600",
  secondary: "bg-[#334155] text-white shadow-sm hover:bg-slate-700",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef(function Button(
  {
    asChild = false,
    href,
    variant = "primary",
    size = "md",
    className = "",
    children,
    ...props
  },
  ref,
) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold",
    "disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  ].join(" ");

  if (asChild && href) {
    return (
      <Link className={classes} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
