"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Card } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const barData = {
  labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  datasets: [
    {
      label: "Hadir",
      data: [104, 112, 108, 117, 110, 62],
      backgroundColor: "#3b82f6",
      borderRadius: 6,
    },
    {
      label: "Telat",
      data: [11, 8, 13, 7, 10, 4],
      backgroundColor: "#f59e0b",
      borderRadius: 6,
    },
  ],
};

const pieData = {
  labels: ["Hadir", "Telat", "Izin/Cuti", "Alpa"],
  datasets: [
    {
      data: [74, 9, 8, 9],
      backgroundColor: ["#16a34a", "#f59e0b", "#06b6d4", "#ef4444"],
      borderColor: "#ffffff",
      borderWidth: 3,
    },
  ],
};

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
};

export function AttendanceCharts() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Kehadiran Mingguan</h2>
          <p className="text-sm text-slate-500">Perbandingan hadir dan telat.</p>
        </div>
        <div className="h-72">
          <Bar data={barData} options={chartOptions} />
        </div>
      </Card>
      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Status Absensi</h2>
          <p className="text-sm text-slate-500">Komposisi status bulan ini.</p>
        </div>
        <div className="h-72">
          <Pie data={pieData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
}
