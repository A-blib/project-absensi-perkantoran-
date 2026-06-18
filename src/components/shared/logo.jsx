import { ShieldCheck } from "lucide-react";

export function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-lg bg-[#3b82f6] text-white">
        <ShieldCheck size={22} aria-hidden="true" />
      </div>
      <div>
        <p className={`text-base font-bold ${dark ? "text-white" : "text-slate-950"}`}>
          AbsenKantor
        </p>
        <p className={`text-xs ${dark ? "text-blue-100" : "text-slate-500"}`}>
          System Absen Perkantoran
        </p>
      </div>
    </div>
  );
}
