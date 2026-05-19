"use client";

/* eslint-disable react-hooks/incompatible-library */

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AttendanceRecapTable({ data }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Pegawai" },
      { accessorKey: "division", header: "Divisi" },
      { accessorKey: "date", header: "Tanggal" },
      { accessorKey: "checkIn", header: "Masuk" },
      { accessorKey: "checkOut", header: "Pulang" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          const labels = { hadir: "Hadir", telat: "Telat", izin: "Izin/Cuti", alpa: "Alpa" };
          return <Badge status={status}>{labels[status]}</Badge>;
        },
      },
      {
        accessorKey: "lateMinutes",
        header: "Telat",
        cell: ({ getValue }) => `${getValue()} menit`,
      },
      { accessorKey: "location", header: "Lokasi" },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Rekap Absensi</h2>
          <p className="text-sm text-slate-500">TanStack Table siap untuk data produksi.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Cari data..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-56"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-5 py-3 font-bold">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="bg-white">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4 font-medium text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
