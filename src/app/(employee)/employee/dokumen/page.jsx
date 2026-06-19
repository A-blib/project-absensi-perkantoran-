"use client";

import { useState } from "react";
import {
  Download,
  FileQuestion,
  Search,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import {
  buildEmployeeDocumentHtml,
  documents,
  employee,
} from "@/lib/profile/employee-profile-data";

function downloadDocument(doc) {
  const blob = new Blob([buildEmployeeDocumentHtml(doc)], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${doc.name.toLowerCase().replaceAll(" ", "-")}-${employee.id}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function EmployeeDocumentsPage() {
  const [activeDocument, setActiveDocument] = useState(null);
  const [search, setSearch] = useState("");

  const filteredDocuments = documents.filter((doc) =>
    [doc.name, doc.type, doc.number, doc.status, doc.summary]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1320px] space-y-4 pb-10">
        <div className="relative overflow-hidden rounded-[20px] border border-[#2F5B86]/80 bg-[linear-gradient(145deg,#102036_0%,#142846_58%,#0B1424_100%)] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,.09)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#A78BFA,#22C55E)]" />
          <div className="absolute left-0 top-0 size-52 rounded-full bg-[#38BDF8]/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#A7B3C6]">Document management</p>
              <h2 className="mt-1 text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
                Dokumen Kepegawaian
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#A7B3C6]">
                Arsip dokumen HR resmi dengan isi berbeda untuk kontrak, payroll, sertifikat, identitas, dan dokumen pendukung.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-11 min-w-[260px] items-center gap-3 rounded-xl border border-[#2D4568] bg-[#0D1728] px-4 text-sm text-[#94A3B8] shadow-[inset_0_1px_0_rgba(255,255,255,.04)] transition focus-within:border-[#38BDF8] hover:border-[#38BDF8]">
                <Search size={17} className="text-[#38BDF8]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari dokumen"
                  className="min-w-0 flex-1 bg-transparent text-[#F8FAFC] outline-none placeholder:text-[#94A3B8]"
                />
              </label>
            </div>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const Icon = doc.Icon;
            return (
              <article
                key={doc.number}
                className="group relative overflow-hidden rounded-[18px] border border-[#315173]/80 bg-[linear-gradient(145deg,#12233A,#0A1526)] p-3.5 text-left shadow-[0_14px_32px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.07)] transition duration-300 hover:-translate-y-0.5 hover:border-[#38BDF8]/70 hover:bg-[#10233A]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#2563EB)] opacity-80" />
                <div className="absolute -right-10 -top-10 size-28 rounded-full bg-[#38BDF8]/10 blur-2xl transition duration-300 group-hover:bg-[#38BDF8]/18" />

                <div className="relative mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#38BDF8]/18 bg-[#38BDF8]/12 text-[#7DD3FC] transition duration-300 group-hover:scale-105 group-hover:bg-[#2563EB] group-hover:text-white">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[#E5EEFF] transition group-hover:text-[#BAE6FD]">
                        {doc.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-[0.12em] text-[#7F90AA]">
                        {doc.number}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    {doc.status}
                  </span>
                </div>

                <div className="relative grid gap-2 rounded-xl border border-[#2C4564] bg-[#08111F]/72 p-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8B9DB5]">Jenis</span>
                    <span className="truncate font-semibold text-[#E5EEFF]">{doc.type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8B9DB5]">Terbit</span>
                    <span className="font-semibold text-[#E5EEFF]">{doc.issuedAt}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8B9DB5]">Ukuran</span>
                    <span className="font-semibold text-[#E5EEFF]">{doc.size}</span>
                  </div>
                </div>

                <p className="relative mt-3 line-clamp-2 text-sm leading-5 text-[#A7B3C6]">
                  {doc.summary}
                </p>
                <div className="relative mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDocument(doc)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2C4564] bg-[#132238] px-3 text-sm font-bold text-[#BAE6FD] transition hover:border-[#38BDF8]/60 hover:bg-[#183554]"
                  >
                    Lihat
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocument(doc)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#60A5FA]/55 bg-[#1D4ED8] px-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,.22)] transition hover:bg-[#2563EB]"
                  >
                    <Download size={15} />
                    Unduh
                  </button>
                </div>
              </article>
            );
          })}

          {!filteredDocuments.length ? (
            <div className="rounded-2xl border border-dashed border-[#2D4568] bg-[#0D1728] p-8 text-center md:col-span-2 xl:col-span-3">
              <FileQuestion className="mx-auto mb-3 text-[#38BDF8]" size={30} />
              <p className="font-bold text-[#F8FAFC]">Dokumen tidak ditemukan.</p>
              <p className="mt-1 text-sm text-[#A7B3C6]">Coba gunakan kata kunci lain.</p>
            </div>
          ) : null}
        </section>
      </div>

      {activeDocument ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#2D4568] bg-[#111C2E] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            <div className="flex items-center justify-between border-b border-[#2D4568] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">{activeDocument.name}</h3>
                <p className="mt-0.5 text-sm text-[#A7B3C6]">{activeDocument.number}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocument(null)}
                className="grid size-9 place-items-center rounded-lg border border-[#2D4568] text-[#CBD5E1] transition hover:bg-[#223754] hover:text-[#F8FAFC]"
                aria-label="Tutup preview dokumen"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[76vh] overflow-auto bg-[#E5EAF2] p-5">
              <div className="mx-auto max-w-2xl rounded-sm bg-white p-8 text-[#172033] shadow-2xl">
                <div className="flex items-start justify-between gap-6 border-b-4 border-[#1D4ED8] pb-4">
                  <div>
                    <p className="text-2xl font-extrabold text-[#1D4ED8]">Corporate EMS</p>
                    <p className="text-sm text-[#526070]">Human Resources & Employee Administration</p>
                  </div>
                  <div className="text-right text-xs leading-6 text-[#526070]">
                    <p>Dokumen: {activeDocument.type}</p>
                    <p>Status: {activeDocument.status}</p>
                    <p>Terbit: {activeDocument.issuedAt}</p>
                  </div>
                </div>

                <div className="py-8 text-center">
                  <h4 className="text-xl font-extrabold uppercase tracking-[0.12em]">
                    {activeDocument.name}
                  </h4>
                  <p className="mt-2 text-sm text-[#526070]">Nomor: {activeDocument.number}</p>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#D7E0EC] text-sm">
                  {[
                    ["Nama Karyawan", employee.name],
                    ["ID Karyawan", employee.id],
                    ["Jabatan", employee.position],
                    ["Departemen", employee.department],
                    ["Penerbit", activeDocument.issuer],
                    ...activeDocument.sections,
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[180px_1fr] border-b border-[#D7E0EC] last:border-b-0">
                      <div className="bg-[#EEF4FF] px-3 py-2 font-bold">{label}</div>
                      <div className="px-3 py-2">{value}</div>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm leading-7">{activeDocument.summary}</p>
                <p className="mt-3 text-sm leading-7">{activeDocument.closing}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#2D4568] px-5 py-4">
              <button
                type="button"
                onClick={() => setActiveDocument(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#2D4568] bg-[#142136] px-4 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => downloadDocument(activeDocument)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#60A5FA]/55 bg-[#1D4ED8] px-4 text-sm font-bold text-white transition hover:bg-[#2563EB]"
              >
                <Download size={16} />
                Unduh Dokumen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
