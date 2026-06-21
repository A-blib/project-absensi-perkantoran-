"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function RekapDateFilter({ startDate, endDate }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const params = new URLSearchParams(searchParams);
    const start = fd.get("startDate");
    const end = fd.get("endDate");
    if (start) params.set("startDate", start);
    else params.delete("startDate");
    if (end) params.set("endDate", end);
    else params.delete("endDate");
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    router.push(pathname);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
        Dari Tanggal
        <input
          type="date"
          name="startDate"
          defaultValue={startDate || ""}
          className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950"
        />
      </label>
      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
        Sampai Tanggal
        <input
          type="date"
          name="endDate"
          defaultValue={endDate || ""}
          className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950"
        />
      </label>
      <button
        type="submit"
        className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Search size={15} />
        Tampilkan
      </button>
      {(startDate || endDate) && (
        <button
          type="button"
          onClick={reset}
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Reset (30 hari)
        </button>
      )}
    </form>
  );
}
