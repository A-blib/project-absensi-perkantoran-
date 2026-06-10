# System Absen Perkantoran

Sistem absensi perkantoran berbasis **Next.js App Router** dan **Supabase**. Project ini dibuat untuk mengelola login admin/pegawai, data pegawai, master divisi, master jabatan, dan pondasi absensi kantor.

Saat ini fokus utama project adalah:

- Autentikasi admin dan pegawai.
- Manajemen user/pegawai.
- Master data divisi.
- Master data jabatan.
- Dashboard admin dan pegawai.
- Rekap absensi awal.
- Fondasi untuk fitur absensi produksi.

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Supabase Postgres
- JWT cookie session
- bcryptjs
- Zod
- TanStack Table
- Chart.js
- lucide-react
- DOMPurify / isomorphic-dompurify

## Menjalankan Project

Install dependency:

```bash
npm install
```

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-secret-key
JWT_SECRET=secret-random-yang-panjang
```

Jalankan development server:

```bash
npm run dev
```

Buka:

```txt
http://localhost:3000
```

## Setup Supabase

1. Buka Supabase Dashboard.
2. Masuk ke project.
3. Buka menu SQL Editor.
4. Copy seluruh isi file `supabase/schema.sql`.
5. Paste ke SQL Editor.
6. Klik Run.

File `supabase/schema.sql` dibuat agar aman dijalankan ulang. Gunakan file ini setiap ada perubahan struktur database.

## Akun Demo

Setelah SQL schema dijalankan, akun demo berikut tersedia:

```txt
Admin
Email: admin@kantor.test
Password: admin123

Pegawai
Email: pegawai@kantor.test
Password: pegawai123
```

Catatan: untuk user baru dari menu Pegawai, sistem mewajibkan email dengan domain `@gmail.com`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Sebelum menyelesaikan perubahan, jalankan minimal:

```bash
npm run lint
npm run build
```

## Routes

```txt
/                       Landing page
/login                  Login admin dan pegawai
/change-password        Ganti password pertama kali

/admin                  Dashboard admin
/admin/pegawai          User management
/admin/divisi           Master divisi
/admin/jabatan          Master jabatan
/admin/absensi          Monitoring absensi placeholder
/admin/rekap            Rekap absensi
/admin/grafik           Grafik kehadiran
/admin/setting          Placeholder setting

/employee               Dashboard pegawai
/employee/absensi       Placeholder absensi kamera
/employee/riwayat       Riwayat pegawai
/employee/profile       Profil pegawai
```

## Struktur Folder

```txt
src/
├── app/
│   ├── (admin)/
│   ├── (auth)/
│   ├── (employee)/
│   └── api/
├── components/
│   ├── shared/
│   ├── tables/
│   └── ui/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── divisions/
│   ├── landing/
│   ├── positions/
│   ├── reports/
│   └── users/
├── lib/
│   ├── constants/
│   ├── security/
│   └── validations/
└── server/
    ├── auth/
    ├── db/
    ├── repositories/
    └── services/
```

## Database

Tabel utama:

```txt
users
divisions
positions
attendances
```

Penjelasan singkat:

- `users`: data admin dan pegawai.
- `divisions`: master data divisi kantor.
- `positions`: master data jabatan yang terhubung ke divisi.
- `attendances`: data absensi.

Saat ini `users` masih menyimpan `division` dan `position` sebagai teks agar alur development sederhana. Master resminya tetap berasal dari tabel `divisions` dan `positions`.

## Fitur Auth

- Login mengambil data dari tabel `users`.
- Password dicek dengan bcrypt.
- Session disimpan di JWT cookie `httpOnly`.
- Route admin, employee, dan change password diproteksi.
- User dengan status `inactive` tidak bisa login.
- User dengan `must_change_password = true` diarahkan ke `/change-password`.
- Logout menghapus cookie session.

## Fitur User Management

Menu:

```txt
/admin/pegawai
```

Fitur:

- Daftar user.
- Tambah pegawai/admin.
- Edit user.
- Lihat detail user.
- Reset password.
- Aktifkan/nonaktifkan akun.
- Ubah role admin/employee.
- Hapus akun.
- Search user.
- Sortir user.
- Dropdown aksi per baris.
- Field divisi dan jabatan memakai master data.

Aturan penting:

- Minimal harus selalu ada 1 admin aktif.
- Admin aktif terakhir tidak bisa dihapus.
- Admin aktif terakhir tidak bisa dinonaktifkan.
- Admin aktif terakhir tidak bisa diubah role menjadi employee.
- Admin yang sedang login tidak bisa menghapus akunnya sendiri.

## Fitur Master Divisi

Menu:

```txt
/admin/divisi
```

Fitur:

- Daftar divisi.
- Tambah divisi.
- Edit divisi.
- Aktifkan/nonaktifkan divisi.
- Hapus divisi.
- Search divisi.

Aturan:

- Divisi yang masih dipakai pegawai tidak boleh dihapus.
- Jika divisi sudah tidak dipakai, lebih aman dinonaktifkan agar histori tetap terbaca.

## Fitur Master Jabatan

Menu:

```txt
/admin/jabatan
```

Fitur:

- Daftar jabatan.
- Tambah jabatan berdasarkan divisi.
- Edit jabatan.
- Aktifkan/nonaktifkan jabatan.
- Hapus jabatan.
- Search jabatan.
- Filter jabatan berdasarkan divisi.

Aturan:

- Jabatan selalu terhubung ke divisi.
- Jabatan yang masih dipakai pegawai tidak boleh dihapus.
- Saat tambah/edit pegawai, dropdown jabatan hanya menampilkan jabatan aktif dari divisi yang dipilih.

## Fitur UI/UX

- Dark mode dan default mode.
- Mobile navigation untuk dashboard admin.
- Logout confirmation popup untuk admin dan pegawai.
- Dropdown aksi user memakai floating portal agar tidak terpotong tabel.
- Modal form pegawai dibuat compact dan punya scroll internal.

## Catatan Untuk Developer / AI Agent Berikutnya

### Jangan Lakukan Ini

- Jangan hardcode credential Supabase.
- Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke client.
- Jangan hapus proteksi minimal 1 admin aktif.
- Jangan hapus alur `must_change_password`.
- Jangan ubah field divisi/jabatan kembali menjadi input bebas tanpa konfirmasi.
- Jangan membuat query database langsung dari client untuk data sensitif.

### Saat Mengubah Database

Update file:

```txt
supabase/schema.sql
```

Pastikan SQL tetap aman dijalankan ulang. Gunakan pola:

```sql
create table if not exists
alter table ... add column if not exists
create index if not exists
on conflict ... do update
```

Setelah mengubah schema, instruksikan user menjalankan ulang isi `supabase/schema.sql` di Supabase SQL Editor.

### Saat Menambah API

- Simpan route di `src/app/api/...`.
- Endpoint admin wajib memakai `requireAdminSession`.
- Validasi request dengan Zod di `src/lib/validations`.
- Query Supabase lewat repository di `src/server/repositories`.
- Return response error dalam format JSON:

```json
{ "message": "Pesan error" }
```

### Saat Menambah Halaman Admin

- Buat page di `src/app/(admin)/admin/...`.
- Bungkus dengan `AdminShell`.
- Tambahkan menu di `src/lib/constants/navigation.js`.
- Jika page mengambil data Supabase di server, gunakan:

```js
export const dynamic = "force-dynamic";
```

### Saat Mengubah Form Pegawai

- Divisi berasal dari `listDivisions({ activeOnly: true })`.
- Jabatan berasal dari `listPositions({ activeOnly: true })`.
- Jabatan harus difilter berdasarkan divisi yang dipilih.
- Jika divisi berubah, reset field jabatan.

### Saat Mengubah UI

- Ikuti pola desain yang sudah ada.
- Gunakan `lucide-react` untuk ikon.
- Pastikan dark mode tetap terbaca.
- Modal besar harus punya scroll internal.
- Dropdown dalam tabel sebaiknya memakai portal/floating menu.

## Prioritas Pengembangan Berikutnya

1. Absensi produksi pegawai.
2. Check-in dan check-out ke Supabase.
3. Kamera/foto absensi.
4. GPS validation.
5. Rekap absensi dari data nyata.
6. Filter rekap berdasarkan tanggal, divisi, status.
7. Dashboard statistik dari data Supabase.
8. Role lanjutan jika dibutuhkan, misalnya `super_admin`, `hr_admin`, atau `division_admin`.

## Status Saat Ini

Project sudah memiliki fondasi cukup kuat untuk:

- Auth berbasis database.
- User management.
- Master divisi.
- Master jabatan.
- Proteksi admin dasar.
- UI awal admin dan pegawai.

Fitur absensi produksi masih menjadi tahap pengembangan berikutnya.

## Boilerplate Menu Setting

Menu:

```txt
/admin/setting
```

Status saat ini:

- Masih berupa UI fondasi untuk review.
- Belum menyimpan data ke Supabase.
- Belum memakai API backend.
- Belum mengubah `supabase/schema.sql`.
- Tidak membaca lokasi GPS admin yang sedang membuka dashboard.
- Tidak terhubung langsung ke fitur absensi produksi.

File utama:

```txt
src/app/(admin)/admin/setting/page.jsx
src/features/settings/admin-settings-panel.jsx
```

Bagian setting yang sudah disiapkan:

```txt
Perusahaan
Jam Kerja
Lokasi Kantor
Aturan Absensi
```

### Perusahaan

Field UI:

```txt
name
email
phone
address
timezone
```

Rencana pemakaian:

- Identitas perusahaan di laporan.
- Header export PDF.
- Watermark atau metadata foto absensi.
- Zona waktu perhitungan jam absensi.

### Jam Kerja

Field UI:

```txt
startTime
lateTolerance
endTime
workDays
shiftMode
```

Rencana pemakaian:

- Menentukan status `hadir` atau `telat`.
- Menghitung menit keterlambatan.
- Menentukan hari kerja aktif.
- Fondasi jika nanti sistem perlu mode shift.

### Lokasi Kantor dan Google Maps

Field UI:

```txt
name
latitude
longitude
radiusMeters
requireLocation
```

Konsep penting:

- Latitude dan longitude adalah titik koordinat kantor/perusahaan.
- `name`, `latitude`, dan `longitude` disiapkan untuk diisi otomatis dari Google Maps Places/Geocoding atau map picker.
- `radiusMeters` adalah aturan sistem absensi yang tetap bisa diatur manual oleh admin.
- Preview radius di peta harus mengikuti nilai `radiusMeters`.
- Titik ini bukan lokasi admin yang sedang membuka dashboard.
- Admin bisa berada di mana saja saat membuka dashboard.
- Sistem absensi pegawai nantinya harus membandingkan GPS pegawai dengan titik kantor yang sudah disimpan di setting.
- UI saat ini menyediakan preview peta fondasi dan link buka koordinat di Google Maps.

Alur integrasi yang disarankan nanti:

```txt
Admin membuka Setting Lokasi Kantor
Admin mencari alamat lewat Google Maps Places/Geocoding
Admin memilih titik kantor di peta
Sistem mengisi nama lokasi, latitude, dan longitude kantor
Admin menyesuaikan radius valid secara manual
Setting disimpan ke Supabase
Pegawai melakukan absensi
Browser pegawai mengambil GPS pegawai
Backend menghitung jarak pegawai ke titik kantor
Backend menentukan valid/tidak berdasarkan radiusMeters
```

Mapping field yang direkomendasikan:

```txt
Google Maps place.name/formatted_address -> location.name
Google Maps geometry.location.lat()      -> location.latitude
Google Maps geometry.location.lng()      -> location.longitude
Input manual admin                       -> location.radiusMeters
Toggle admin                             -> location.requireLocation
```

Fondasi aksesibilitas input link Google Maps:

```txt
location.googleMapsLink
```

UI Setting menyediakan field untuk menempel link Google Maps dan tombol
`Terapkan Lokasi`. Saat ini parsing dilakukan di browser untuk link yang sudah
memuat koordinat.

Format yang didukung oleh fondasi UI:

```txt
https://www.google.com/maps/place/.../@-6.208763,106.845599,...
https://www.google.com/maps/search/?api=1&query=-6.208763,106.845599
https://www.google.com/maps?...&q=-6.208763,106.845599
https://www.google.com/maps?...&ll=-6.208763,106.845599
https://www.google.com/maps?...!3d-6.208763!4d106.845599
```

Perilaku:

- Jika link berisi koordinat, tombol `Terapkan Lokasi` mengisi `latitude` dan `longitude`.
- Jika link memiliki path `/place/...`, nama lokasi bisa diambil sebagai draft `name`.
- Radius tidak diambil dari Google Maps; radius tetap aturan sistem yang diatur manual oleh admin.
- Link pendek seperti `https://maps.app.goo.gl/...` atau link yang perlu redirect belum diproses di UI ini.

Jika nanti ingin mendukung link pendek atau alamat tanpa koordinat, prosesnya
lebih baik dilakukan lewat backend/API:

```txt
Terima link Google Maps
Resolve redirect jika link pendek
Ambil place id atau alamat
Panggil Google Maps Geocoding/Places API
Kembalikan name, latitude, longitude ke UI
```

Boilerplate teknis untuk fase berikutnya:

```txt
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=google-maps-browser-key
```

Catatan keamanan:

- Google Maps browser key boleh memakai prefix `NEXT_PUBLIC_`, tetapi wajib dibatasi di Google Cloud Console dengan HTTP referrer/domain.
- Jangan taruh service account atau secret Google API di client.
- Validasi jarak final tetap sebaiknya dilakukan di backend, bukan hanya di browser.

Rumus jarak yang direkomendasikan:

```txt
Haversine formula
```

Input:

```txt
officeLatitude
officeLongitude
employeeLatitude
employeeLongitude
```

Output:

```txt
distanceMeters
isInsideRadius = distanceMeters <= radiusMeters
```

### Aturan Absensi

Field UI:

```txt
requireCheckInPhoto
requireCheckOutPhoto
allowOutsideRadius
allowEarlyCheckIn
maxCheckOutTime
oneCheckInPerDay
```

Rencana pemakaian:

- Menentukan apakah foto wajib saat check-in/check-out.
- Menentukan apakah absensi di luar radius boleh diterima.
- Menentukan apakah check-in sebelum jam kerja boleh dilakukan.
- Mencegah data check-in ganda dalam satu hari.

### Rekomendasi Integrasi Database Nanti

Jika UI setting sudah disetujui, buat penyimpanan terpisah agar tidak mengganggu tabel absensi.

Contoh opsi tabel:

```txt
system_settings
```

Contoh kolom:

```txt
id
company jsonb
work_hours jsonb
office_location jsonb
attendance_rules jsonb
updated_by
updated_at
```

Atau jika ingin lebih normalized:

```txt
company_settings
work_hour_settings
office_locations
attendance_rule_settings
```

Catatan untuk fitur absensi:

- Jangan ambil setting dari localStorage.
- Fitur absensi produksi harus membaca setting dari backend/Supabase.
- Browser pegawai hanya mengirim koordinat pegawai dan data capture yang dibutuhkan.
- Backend yang menentukan status akhir absensi berdasarkan setting.
