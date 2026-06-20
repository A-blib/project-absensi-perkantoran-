create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('admin', 'employee');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type attendance_status as enum ('hadir', 'telat', 'izin', 'alpa');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(160) not null unique,
  password_hash text not null,
  role user_role not null default 'employee',
  division varchar(120),
  position varchar(120),
  phone varchar(40),
  employee_code varchar(60) unique,
  status varchar(20) not null default 'active',
  must_change_password boolean not null default false,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint users_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null unique,
  code varchar(60) unique,
  description text,
  status varchar(20) not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint divisions_status_check check (status in ('active', 'inactive'))
);

alter table public.divisions add column if not exists code varchar(60);
alter table public.divisions add column if not exists description text;
alter table public.divisions add column if not exists status varchar(20) not null default 'active';
alter table public.divisions add column if not exists updated_at timestamptz default now();

do $$ begin
  alter table public.divisions add constraint divisions_status_check check (status in ('active', 'inactive'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists divisions_code_unique
on public.divisions (code)
where code is not null;

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete restrict,
  name varchar(120) not null,
  code varchar(60),
  description text,
  status varchar(20) not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint positions_status_check check (status in ('active', 'inactive')),
  unique (division_id, name)
);

alter table public.positions add column if not exists code varchar(60);
alter table public.positions add column if not exists description text;
alter table public.positions add column if not exists status varchar(20) not null default 'active';
alter table public.positions add column if not exists updated_at timestamptz default now();

do $$ begin
  alter table public.positions add constraint positions_status_check check (status in ('active', 'inactive'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists positions_division_code_unique
on public.positions (division_id, code)
where code is not null;

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null unique,
  start_time varchar(5) not null,
  end_time varchar(5) not null,
  description text,
  status varchar(20) not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint shifts_status_check check (status in ('active', 'inactive'))
);

alter table public.users add column if not exists shift_id uuid references public.shifts(id) on delete set null;

alter table public.users add column if not exists division varchar(120);
alter table public.users add column if not exists position varchar(120);
alter table public.users add column if not exists phone varchar(40);
alter table public.users add column if not exists employee_code varchar(60);
alter table public.users add column if not exists status varchar(20) not null default 'active';
alter table public.users add column if not exists must_change_password boolean not null default false;
alter table public.users add column if not exists updated_at timestamptz default now();

do $$ begin
  alter table public.users add constraint users_status_check check (status in ('active', 'inactive'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists users_employee_code_unique
on public.users (employee_code)
where employee_code is not null;

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  attendance_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status attendance_status not null,
  late_minutes integer default 0,
  photo_url text,
  latitude text,
  longitude text,
  current_location_label text,
  location_label text,
  created_at timestamptz default now(),
  unique (user_id, attendance_date)
);

alter table public.attendances add column if not exists current_location_label text;

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(20) not null,
  start_date date not null,
  end_date date not null,
  reason text not null,
  attachment_name varchar(180),
  attachment_type varchar(80),
  attachment_data text,
  status varchar(20) not null default 'Menunggu',
  admin_note text,
  submitted_at timestamptz default now(),
  decided_at timestamptz,
  decided_by uuid references public.users(id) on delete set null,
  constraint leave_requests_type_check check (type in ('Izin', 'Sakit', 'Cuti')),
  constraint leave_requests_status_check check (status in ('Menunggu', 'Disetujui', 'Ditolak')),
  constraint leave_requests_date_check check (end_date >= start_date)
);

alter table public.leave_requests add column if not exists attachment_type varchar(80);
alter table public.leave_requests add column if not exists attachment_data text;

create table if not exists public.employee_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_type varchar(40) not null,
  source_id uuid not null,
  action varchar(40) not null,
  title varchar(160) not null,
  message text not null,
  tone varchar(30) not null default 'primary',
  occurred_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists employee_activities_source_unique
on public.employee_activities (user_id, source_type, source_id, action);

create index if not exists employee_activities_user_occurred_idx
on public.employee_activities (user_id, occurred_at desc)
where deleted_at is null;

create table if not exists public.app_settings (
  key varchar(120) primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.attendances enable row level security;
alter table public.divisions enable row level security;
alter table public.positions enable row level security;
alter table public.app_settings enable row level security;
alter table public.leave_requests enable row level security;
alter table public.employee_activities enable row level security;
alter table public.shifts enable row level security;

drop policy if exists "service role can manage users" on public.users;
create policy "service role can manage users"
on public.users
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage attendances" on public.attendances;
create policy "service role can manage attendances"
on public.attendances
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage divisions" on public.divisions;
create policy "service role can manage divisions"
on public.divisions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage positions" on public.positions;
create policy "service role can manage positions"
on public.positions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage app settings" on public.app_settings;
create policy "service role can manage app settings"
on public.app_settings
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage leave requests" on public.leave_requests;
create policy "service role can manage leave requests"
on public.leave_requests
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage employee activities" on public.employee_activities;
create policy "service role can manage employee activities"
on public.employee_activities
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage shifts" on public.shifts;
create policy "service role can manage shifts"
on public.shifts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage shifts" on public.shifts;
create policy "service role can manage shifts"
on public.shifts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.app_settings (key, value)
values (
  'system_settings',
  '{
    "company": {
      "name": "PT Kantor Sejahtera",
      "email": "hr@kantor.test",
      "phone": "021-555-0199",
      "address": "Jl. Sudirman No. 10, Jakarta Pusat",
      "timezone": "Asia/Jakarta"
    },
    "workHours": {
      "startTime": "08:00",
      "lateTolerance": 15,
      "endTime": "17:00",
      "workDays": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
      "shiftMode": "non-shift"
    },
    "location": {
      "name": "Kantor Pusat Jakarta",
      "googleMapsLink": "",
      "latitude": "-6.208763",
      "longitude": "106.845599",
      "radiusMeters": 100,
      "requireLocation": true
    },
    "attendanceRules": {
      "requireCheckInPhoto": true,
      "requireCheckOutPhoto": false,
      "allowOutsideRadius": false,
      "allowEarlyCheckIn": true,
      "maxCheckOutTime": "21:00",
      "oneCheckInPerDay": true
    }
  }'::jsonb
)
on conflict (key) do nothing;

insert into public.divisions (name, code, description, status)
values
  ('HR', 'HR', 'Human Resources dan pengelolaan karyawan.', 'active'),
  ('Finance', 'FIN', 'Keuangan, payroll, dan administrasi pembayaran.', 'active'),
  ('IT', 'IT', 'Teknologi informasi dan dukungan sistem.', 'active'),
  ('Operasional', 'OPS', 'Operasional kantor dan aktivitas harian.', 'active'),
  ('Sales', 'SLS', 'Penjualan dan relasi pelanggan.', 'active')
on conflict (name) do update set
  code = excluded.code,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.positions (division_id, name, code, description, status)
select divisions.id, seed.name, seed.code, seed.description, 'active'
from public.divisions divisions
join (
  values
    ('HR', 'HR Manager', 'HR-MGR', 'Memimpin fungsi HR dan kebijakan karyawan.'),
    ('HR', 'Staff HR', 'HR-STF', 'Administrasi HR dan data pegawai.'),
    ('Finance', 'Finance Manager', 'FIN-MGR', 'Memimpin fungsi keuangan.'),
    ('Finance', 'Staff Finance', 'FIN-STF', 'Administrasi keuangan harian.'),
    ('IT', 'IT Manager', 'IT-MGR', 'Memimpin operasional teknologi.'),
    ('IT', 'Backend Developer', 'IT-BE', 'Pengembangan backend dan API.'),
    ('Operasional', 'Supervisor Operasional', 'OPS-SPV', 'Koordinasi operasional harian.'),
    ('Sales', 'Sales Executive', 'SLS-EXE', 'Penjualan dan relasi pelanggan.')
) as seed(division_name, name, code, description)
  on divisions.name = seed.division_name
on conflict (division_id, name) do update set
  code = excluded.code,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.users (
  name,
  email,
  password_hash,
  role,
  division,
  position,
  phone,
  status,
  must_change_password
)
values
  (
    'Admin HR',
    'admin@kantor.test',
    '$2b$12$9RSvynZ4BfY8Ae6s5PJ.GOlDZEtRpkkTRriDdse2ZLkXEnvI6r5mK',
    'admin',
    'HR',
    'HR Manager',
    '081200000001',
    'active',
    false
  ),
  (
    'Rina Pratiwi',
    'pegawai@kantor.test',
    '$2b$12$IsnP5j46MbFvKo/0MwUdk.wNs/WN5/R0iFyar9FQCpElVrij9DXVa',
    'employee',
    'Finance',
    'Staff Finance',
    '081200000002',
    'active',
    false
  ),
  (
    'Budi Santoso',
    'budi@kantor.test',
    '$2b$12$IsnP5j46MbFvKo/0MwUdk.wNs/WN5/R0iFyar9FQCpElVrij9DXVa',
    'employee',
    'Operasional',
    'Supervisor Operasional',
    '081200000003',
    'active',
    false
  ),
  (
    'Sari Ningsih',
    'sari@kantor.test',
    '$2b$12$IsnP5j46MbFvKo/0MwUdk.wNs/WN5/R0iFyar9FQCpElVrij9DXVa',
    'employee',
    'HR',
    'Staff HR',
    '081200000004',
    'active',
    false
  ),
  (
    'Andi Wijaya',
    'andi@kantor.test',
    '$2b$12$IsnP5j46MbFvKo/0MwUdk.wNs/WN5/R0iFyar9FQCpElVrij9DXVa',
    'employee',
    'IT',
    'Backend Developer',
    '081200000005',
    'active',
    false
  ),
  (
    'Dewi Kusuma',
    'dewi@kantor.test',
    '$2b$12$IsnP5j46MbFvKo/0MwUdk.wNs/WN5/R0iFyar9FQCpElVrij9DXVa',
    'employee',
    'Sales',
    'Sales Executive',
    '081200000006',
    'active',
    false
  )
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  division = excluded.division,
  position = excluded.position,
  phone = excluded.phone,
  status = excluded.status,
  must_change_password = excluded.must_change_password,
  updated_at = now();

update public.users
set employee_code = 'ADM-001', updated_at = now()
where email = 'admin@kantor.test'
  and not exists (
    select 1
    from public.users other_users
    where other_users.employee_code = 'ADM-001'
      and other_users.email <> 'admin@kantor.test'
  );

update public.users
set employee_code = 'EMP-001', updated_at = now()
where email = 'pegawai@kantor.test'
  and not exists (
    select 1
    from public.users other_users
    where other_users.employee_code = 'EMP-001'
      and other_users.email <> 'pegawai@kantor.test'
  );

update public.users
set employee_code = seed.employee_code, updated_at = now()
from (
  values
    ('budi@kantor.test', 'EMP-002'),
    ('sari@kantor.test', 'EMP-003'),
    ('andi@kantor.test', 'EMP-004'),
    ('dewi@kantor.test', 'EMP-005')
) as seed(email, employee_code)
where users.email = seed.email
  and not exists (
    select 1
    from public.users other_users
    where other_users.employee_code = seed.employee_code
      and other_users.email <> seed.email
  );

insert into public.attendances (
  user_id,
  attendance_date,
  check_in_at,
  check_out_at,
  status,
  late_minutes,
  location_label
)
select
  users.id,
  current_date,
  now()::date + time '08:01',
  now()::date + time '17:02',
  'hadir',
  0,
  'Kantor Pusat'
from public.users
where users.email = 'pegawai@kantor.test'
on conflict (user_id, attendance_date) do update set
  check_in_at = excluded.check_in_at,
  check_out_at = excluded.check_out_at,
  status = excluded.status,
  late_minutes = excluded.late_minutes,
  location_label = excluded.location_label;

insert into public.attendances (
  user_id,
  attendance_date,
  check_in_at,
  check_out_at,
  status,
  late_minutes,
  location_label
)
select
  users.id,
  current_date,
  now()::date + seed.check_in,
  case
    when seed.check_out is null then null
    else now()::date + seed.check_out
  end,
  seed.status::attendance_status,
  seed.late_minutes,
  seed.location_label
from public.users
join (
  values
    ('budi@kantor.test', time '08:18', time '17:10', 'telat', 18, 'Kantor Pusat'),
    ('sari@kantor.test', null, null, 'izin', 0, '-'),
    ('andi@kantor.test', time '07:58', time '17:03', 'hadir', 0, 'Kantor Pusat'),
    ('dewi@kantor.test', null, null, 'alpa', 0, '-')
) as seed(email, check_in, check_out, status, late_minutes, location_label)
  on users.email = seed.email
on conflict (user_id, attendance_date) do update set
  check_in_at = excluded.check_in_at,
  check_out_at = excluded.check_out_at,
  status = excluded.status,
  late_minutes = excluded.late_minutes,
  location_label = excluded.location_label;
