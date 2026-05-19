import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Camera,
  Clock3,
  Home,
  LayoutDashboard,
  Settings,
  Table2,
  User,
  Users,
} from "lucide-react";

export const employeeNav = [
  { label: "Home", href: "/employee", icon: Home },
  { label: "Absensi", href: "/employee/absensi", icon: Camera },
  { label: "Riwayat", href: "/employee/riwayat", icon: Clock3 },
  { label: "Profile", href: "/employee/profile", icon: User },
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
