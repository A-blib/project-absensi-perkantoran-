import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(160),
  password: z.string().min(6, "Password minimal 6 karakter").max(120),
});
