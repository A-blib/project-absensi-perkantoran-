import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Camera,
  Clock3,
  FilePenLine,
  Files,
  FolderArchive,
  Home,
  LayoutDashboard,
  Bell,
  CalendarDays,
  CalendarClock,
  Settings,
  Table2,
  User,
  Users,
} from "lucide-react";

export const employeeNav = [
  { label: "Dashboard", href: "/employee", icon: Home },
  { label: "Absensi", href: "/employee/absensi", icon: Camera },
  { label: "Riwayat Absensi", href: "/employee/riwayat", icon: Clock3 },
  { label: "Pengajuan Izin", href: "/employee/izin", icon: FilePenLine },
  { label: "Jadwal Kerja", href: "/employee/jadwal", icon: CalendarDays },
  { label: "Profil Saya", href: "/employee/profile", icon: User },
  { label: "Notifikasi", href: "/employee/notifikasi", icon: Bell },
];

export const employeeLeaveSubNav = [
  { label: "Pengajuan Baru", href: "/employee/izin", icon: FilePenLine },
  { label: "Riwayat Pengajuan", href: "/employee/riwayat-izin", icon: Files },
];

export const employeeScheduleSubNav = [
  { label: "Kalender Kerja", href: "/employee/jadwal", icon: CalendarDays },
  { label: "Upcoming Activities", href: "/employee/upcoming-activities", icon: CalendarClock },
];

export const employeeProfileSubNav = [
  { label: "Ringkasan Profil", href: "/employee/profile", icon: User },
  { label: "Dokumen", href: "/employee/dokumen", icon: FolderArchive },
];

export const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pegawai", href: "/admin/pegawai", icon: Users },
  { label: "Divisi", href: "/admin/divisi", icon: Building2 },
  { label: "Jabatan", href: "/admin/jabatan", icon: BriefcaseBusiness },
  { label: "Absensi", href: "/admin/absensi", icon: Camera },
  { label: "Rekap", href: "/admin/rekap", icon: Table2 },
  { label: "Grafik", href: "/admin/grafik", icon: BarChart3 },
  { label: "Setting", href: "/admin/setting", icon: Settings },
];
