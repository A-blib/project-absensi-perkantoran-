import {
  date,
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "employee"]);
export const attendanceStatus = pgEnum("attendance_status", [
  "hadir",
  "telat",
  "izin",
  "alpa",
]);

export const divisions = pgTable("divisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  code: varchar("code", { length: 60 }).unique(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("employee"),
  division: varchar("division", { length: 120 }),
  position: varchar("position", { length: 120 }),
  phone: varchar("phone", { length: 40 }),
  employeeCode: varchar("employee_code", { length: 60 }).unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const attendances = pgTable("attendances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  checkInAt: timestamp("check_in_at", { withTimezone: true }),
  checkOutAt: timestamp("check_out_at", { withTimezone: true }),
  status: attendanceStatus("status").notNull(),
  lateMinutes: integer("late_minutes").default(0),
  photoUrl: text("photo_url"),
  photoOutUrl: text("photo_out_url"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationLabel: text("location_label"),
  latitudeOut: text("latitude_out"),
  longitudeOut: text("longitude_out"),
  locationOutLabel: text("location_out_label"),
  faceSignature: text("face_signature"),
  faceOutSignature: text("face_out_signature"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  requestType: varchar("type", { length: 40 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  attachmentName: text("attachment_name"),
  attachmentUrl: text("attachment_url"),
  status: varchar("status", { length: 20 }).notNull().default("Menunggu"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
