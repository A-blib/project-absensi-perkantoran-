"use client";

import { useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        boxWidth: 12,
        color: "#475569",
        font: { family: "Inter", size: 12 },
      },
    },
  },
  scales: {
    x: { stacked: false, grid: { display: false } },
    y: { stacked: false, beginAtZero: true, ticks: { stepSize: 1 } },
  },
};

const STATUS_META = [
  { key: "hadir", label: "Hadir", color: "text-emerald-600 bg-emerald-50" },
  { key: "telat", label: "Telat", color: "text-amber-600 bg-amber-50" },
  { key: "izin", label: "Izin/Cuti", color: "text-cyan-600 bg-cyan-50" },
  { key: "alpa", label: "Alpa", color: "text-red-600 bg-red-50" },
];

function SummaryCard({ label, value, colorClass }) {
  return (
    <div className={`rounded-2xl border p-4 ${colorClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

export function AttendanceAnalyticsCharts({ initialData }) {
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState(initialData.period || "monthly");
  const [loading, setLoading] = useState(false);

  async function changePeriod(newPeriod) {
    if (newPeriod === period || loading) return;
    setPeriod(newPeriod);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/attendance-analytics?period=${newPeriod}`);
      const result = await response.json();

      if (response.ok) setData(result);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }

  const barData = {
    labels: data.labels || [],
    datasets: data.datasets || [],
  };

  const totalRecorded = Object.values(data.summary || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="grid gap-6 overflow-x-hidden">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATUS_META.map(({ key, label, color }) => (
          <SummaryCard
            key={key}
            label={label}
            value={data.summary?.[key] ?? 0}
            colorClass={`border-slate-200 ${color}`}
          />
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Tren Kehadiran {PERIOD_OPTIONS.find((p) => p.value === period)?.label}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {totalRecorded} entri absensi tercatat dalam periode ini.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => changePeriod(opt.value)}
                disabled={loading}
                className={[
                  "h-9 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-50",
                  period === opt.value
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`h-80 transition-opacity ${loading ? "opacity-40" : "opacity-100"}`}>
          {barData.labels.length > 0 ? (
            <Bar data={barData} options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
              Belum ada data absensi untuk periode ini.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
