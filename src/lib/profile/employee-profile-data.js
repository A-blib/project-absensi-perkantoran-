import {
  Award,
  FileCheck2,
  FileText,
  IdCard,
} from "lucide-react";

export const employee = {
  name: "Rina Pratiwi",
  id: "EMP-2026-041",
  position: "Finance Officer",
  department: "Keuangan",
  email: "rina.pratiwi@hr-futuristic.test",
  phone: "+62 812 3344 8899",
  address: "Jl. Jenderal Sudirman, Pekanbaru",
  education: "S1 Akuntansi dan Keuangan",
  joinDate: "12 Januari 2024",
  status: "Karyawan Aktif",
  contract: "Tetap",
  supervisor: "Andika Pratama",
};

export const documents = [
  {
    name: "Kontrak Kerja",
    type: "Perjanjian Kerja",
    size: "2.4 MB",
    number: "PKWT/EMS-HR/001/2024",
    issuedAt: "12 Januari 2024",
    issuer: "Human Resources",
    status: "Aktif",
    Icon: FileText,
    summary:
      "Perjanjian kerja karyawan tetap yang memuat jabatan, lokasi kerja, hak, kewajiban, dan ketentuan perusahaan.",
    sections: [
      ["Jenis Perjanjian", "Karyawan Tetap"],
      ["Tanggal Mulai", "12 Januari 2024"],
      ["Lokasi Kerja", "Kantor Pusat Pekanbaru"],
      ["Atasan Langsung", employee.supervisor],
      ["Hak & Kewajiban", "Mengikuti kebijakan perusahaan, menjaga kerahasiaan data, dan memenuhi target pekerjaan finance."],
    ],
    closing:
      "Perjanjian ini menjadi dasar hubungan kerja antara karyawan dan Corporate EMS selama status kepegawaian aktif.",
  },
  {
    name: "Slip Gaji Juni",
    type: "Payroll Statement",
    size: "1.1 MB",
    number: "PAY/FIN/06/2026/041",
    issuedAt: "30 Juni 2026",
    issuer: "Finance Payroll",
    status: "Terverifikasi",
    Icon: FileCheck2,
    summary:
      "Rincian penghasilan bulanan, tunjangan, potongan, dan total penerimaan bersih periode Juni 2026.",
    sections: [
      ["Gaji Pokok", "Rp 8.500.000"],
      ["Tunjangan Jabatan", "Rp 1.250.000"],
      ["Tunjangan Transport", "Rp 600.000"],
      ["Potongan BPJS & Pajak", "Rp 875.000"],
      ["Take Home Pay", "Rp 9.475.000"],
    ],
    closing:
      "Slip gaji ini diterbitkan otomatis oleh sistem payroll dan telah diverifikasi oleh Finance Payroll.",
  },
  {
    name: "Sertifikat Finance",
    type: "Certificate",
    size: "3.8 MB",
    number: "CERT/FIN/2025/118",
    issuedAt: "18 November 2025",
    issuer: "Corporate Learning Center",
    status: "Valid",
    Icon: Award,
    summary:
      "Sertifikat kompetensi internal untuk modul financial reporting, payroll validation, dan audit preparation.",
    sections: [
      ["Program", "Finance Operational Excellence"],
      ["Modul", "Financial Reporting, Payroll Validation, Audit Preparation"],
      ["Durasi Pelatihan", "24 Jam Pelatihan"],
      ["Nilai Akhir", "92 / 100"],
      ["Predikat", "Excellent"],
    ],
    closing:
      "Sertifikat ini menyatakan bahwa karyawan telah memenuhi standar kompetensi internal Corporate EMS.",
  },
  {
    name: "Identitas Karyawan",
    type: "Employee Identity",
    size: "820 KB",
    number: "ID/EMS/EMP-2026-041",
    issuedAt: "12 Januari 2024",
    issuer: "HR Administration",
    status: "Aktif",
    Icon: IdCard,
    summary:
      "Kartu identitas karyawan berisi nomor induk, departemen, jabatan, dan status kepegawaian.",
    sections: [
      ["Nomor Induk", employee.id],
      ["Nama Lengkap", employee.name],
      ["Departemen", employee.department],
      ["Jabatan", employee.position],
      ["Status Kartu", "Aktif dan berlaku selama masa kerja"],
    ],
    closing:
      "Identitas ini digunakan untuk akses internal kantor dan verifikasi administrasi karyawan.",
  },
  {
    name: "Dokumen Pendukung",
    type: "Supporting Archive",
    size: "5.2 MB",
    number: "ARCH/HR/EMP-041",
    issuedAt: "10 Januari 2024",
    issuer: "HR Document Control",
    status: "Lengkap",
    Icon: FileText,
    summary:
      "Arsip pendukung administrasi yang berisi salinan ijazah, NPWP, rekening payroll, dan dokumen onboarding.",
    sections: [
      ["Ijazah", "Tersimpan"],
      ["NPWP", "Tersimpan"],
      ["Rekening Payroll", "Terverifikasi"],
      ["Form Onboarding", "Lengkap"],
      ["Kontak Darurat", "Tersimpan"],
    ],
    closing:
      "Arsip ini menjadi referensi kelengkapan administrasi awal dan pembaruan data karyawan.",
  },
];

export function buildEmployeeDocumentHtml(doc) {
  const rows = doc.sections
    .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${doc.name} - ${employee.name}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #172033; margin: 0; padding: 32px; background: #f4f7fb; }
    .paper { max-width: 820px; margin: 0 auto; background: white; border: 1px solid #d7e0ec; padding: 38px; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #1d4ed8; padding-bottom: 18px; }
    .brand { font-size: 22px; font-weight: 800; color: #1d4ed8; }
    .meta { text-align: right; font-size: 12px; color: #526070; line-height: 1.6; }
    h1 { margin: 34px 0 6px; font-size: 24px; text-transform: uppercase; letter-spacing: .08em; text-align: center; }
    .docno { text-align: center; color: #526070; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 10px 12px; border: 1px solid #d7e0ec; vertical-align: top; }
    td:first-child { width: 210px; background: #eef4ff; font-weight: 700; }
    p { line-height: 1.7; }
    .stamp { margin-top: 34px; display: flex; justify-content: space-between; gap: 40px; }
    .sign { width: 240px; text-align: center; }
    .line { margin-top: 76px; border-top: 1px solid #172033; padding-top: 8px; font-weight: 700; }
  </style>
</head>
<body>
  <main class="paper">
    <section class="header">
      <div>
        <div class="brand">Corporate EMS</div>
        <div>Human Resources & Employee Administration</div>
      </div>
      <div class="meta">
        Dokumen: ${doc.type}<br />
        Status: ${doc.status}<br />
        Tanggal Terbit: ${doc.issuedAt}
      </div>
    </section>
    <h1>${doc.name}</h1>
    <div class="docno">Nomor: ${doc.number}</div>
    <table>
      <tr><td>Nama Karyawan</td><td>${employee.name}</td></tr>
      <tr><td>ID Karyawan</td><td>${employee.id}</td></tr>
      <tr><td>Jabatan</td><td>${employee.position}</td></tr>
      <tr><td>Departemen</td><td>${employee.department}</td></tr>
      <tr><td>Penerbit</td><td>${doc.issuer}</td></tr>
      ${rows}
    </table>
    <p>${doc.summary}</p>
    <p>${doc.closing}</p>
    <section class="stamp">
      <div class="sign">
        <div>Pekanbaru, ${doc.issuedAt}</div>
        <div class="line">${doc.issuer}</div>
      </div>
      <div class="sign">
        <div>Karyawan</div>
        <div class="line">${employee.name}</div>
      </div>
    </section>
  </main>
</body>
</html>`;
}
