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

const emptyBarData = { labels: [], datasets: [] };

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

function buildPieData(statusCounts) {
  return {
    labels: ["Hadir", "Telat", "Izin/Cuti", "Alpa"],
    datasets: [
      {
        data: [
          statusCounts?.hadir || 0,
          statusCounts?.telat || 0,
          statusCounts?.izin || 0,
          statusCounts?.alpa || 0,
        ],
        backgroundColor: ["#16a34a", "#f59e0b", "#06b6d4", "#ef4444"],
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  };
}

export function AttendanceCharts({ statusCounts, weeklyData }) {
  const barData = weeklyData || emptyBarData;
  const pieData = buildPieData(statusCounts);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Kehadiran Mingguan</h2>
          <p className="text-sm text-slate-500">
            Data 7 hari terakhir dari absensi karyawan.
          </p>
        </div>
        <div className="h-72">
          <Bar data={barData} options={chartOptions} />
        </div>
      </Card>
      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Status Absensi</h2>
          <p className="text-sm text-slate-500">Komposisi status dari data absensi.</p>
        </div>
        <div className="h-72">
          <Pie data={pieData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
}
