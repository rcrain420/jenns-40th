import { z } from "zod";

/** Empty / missing stays a name-only seat. A value must be a real email. */
export const optionalAnglerEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.toLowerCase() : undefined))
  .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
    message: "Valid email required",
  });
