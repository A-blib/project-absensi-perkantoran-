import { z } from "zod";

const timeValue = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const defaultSystemSettings = {
  company: {
    name: "PT Kantor Sejahtera",
    email: "hr@kantor.test",
    phone: "021-555-0199",
    address: "Jl. Sudirman No. 10, Jakarta Pusat",
    timezone: "Asia/Jakarta",
  },
  workHours: {
    startTime: "08:00",
    lateTolerance: 15,
    endTime: "17:00",
    workDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
  },
  location: {
    name: "Kantor Pusat Jakarta",
    googleMapsLink: "",
    latitude: "-6.208763",
    longitude: "106.845599",
    radiusMeters: 100,
    requireLocation: true,
  },
  attendanceRules: {
    requireCheckInPhoto: true,
    requireCheckOutPhoto: false,
    allowOutsideRadius: false,
    allowEarlyCheckIn: true,
    maxCheckOutTime: "21:00",
    oneCheckInPerDay: true,
  },
};

export const systemSettingsSchema = z.object({
  company: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().max(40),
    address: z.string().trim().min(5).max(500),
    timezone: z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"]),
  }),
  workHours: z
    .object({
      startTime: timeValue,
      lateTolerance: z.number().int().min(0).max(240),
      endTime: timeValue,
      workDays: z
        .array(
          z.enum([
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
            "Minggu",
          ]),
        )
        .min(1),
    })
    .refine((value) => value.startTime < value.endTime, {
      message: "Jam masuk harus lebih awal dari jam pulang.",
      path: ["endTime"],
    }),
  location: z.object({
    name: z.string().trim().min(2).max(160),
    googleMapsLink: z.string().trim().max(1000).optional().default(""),
    latitude: z.string().trim().regex(/^-?\d+(\.\d+)?$/),
    longitude: z.string().trim().regex(/^-?\d+(\.\d+)?$/),
    radiusMeters: z.number().int().min(1).max(5000),
    requireLocation: z.boolean(),
  }),
  attendanceRules: z.object({
    requireCheckInPhoto: z.boolean(),
    requireCheckOutPhoto: z.boolean(),
    allowOutsideRadius: z.boolean(),
    allowEarlyCheckIn: z.boolean(),
    maxCheckOutTime: timeValue,
    oneCheckInPerDay: z.boolean(),
  }),
});
