import { z } from "zod";

export const loginSchema = z.object({
  role: z.enum(["admin", "employee"], {
    message: "Pilih jenis akun terlebih dahulu.",
  }),
  email: z.string().trim().email("Email tidak valid").max(160),
  password: z.string().min(6, "Password minimal 6 karakter").max(120),
});
