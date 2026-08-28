import { z } from "zod";
import { optionalAnglerEmailSchema } from "./angler-email";
import { MAX_ANGLERS, MIN_ANGLERS, SIDE_POT_IDS } from "./config";

const anglerSchema = z.object({
  fullName: z.string().trim().min(1, "Angler name is required"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: optionalAnglerEmailSchema,
});

const teamFieldsSchema = z.object({
  teamName: z.string().trim().min(1, "Team name is required"),
  boatType: z.enum(["GUIDED", "NON_GUIDED"]),
  captainName: z.string().trim().optional(),
  captainPhone: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  registrantEmail: z.string().trim().email("Valid email required"),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  anglers: z
    .array(anglerSchema)
    .min(MIN_ANGLERS, `At least ${MIN_ANGLERS} anglers required`)
    .max(MAX_ANGLERS, `At most ${MAX_ANGLERS} anglers allowed`),
  sidePots: z
    .array(z.enum(SIDE_POT_IDS))
    .default([])
    .transform((pots) => Array.from(new Set(pots))),
});

function refineBoatContact<T extends z.infer<typeof teamFieldsSchema>>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.boatType === "GUIDED") {
    if (!data.captainName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["captainName"],
        message: "Captain name is required for guided boats",
      });
    }
    if (!data.captainPhone?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["captainPhone"],
        message: "Captain phone is required for guided boats",
      });
    }
  } else {
    if (!data.contactName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["contactName"],
        message: "Primary contact name is required",
      });
    }
    if (!data.contactPhone?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "Primary contact phone is required",
      });
    }
    if (!data.contactEmail?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["contactEmail"],
        message: "Primary contact email is required",
      });
    } else if (!z.string().email().safeParse(data.contactEmail).success) {
      ctx.addIssue({
        code: "custom",
        path: ["contactEmail"],
        message: "Valid contact email required",
      });
    }
  }
}

export const registrationSchema = teamFieldsSchema
  .extend({
    licenseConfirmed: z.literal(true, {
      error: "You must confirm each angler has a valid fishing license",
    }),
  })
  .superRefine(refineBoatContact);

export const adminTeamUpdateSchema = teamFieldsSchema
  .extend({
    licenseConfirmed: z.boolean(),
    paymentStatus: z.enum(["UNPAID", "PAID"]),
  })
  .superRefine(refineBoatContact);

export const teamRosterSchema = z.object({
  anglers: z
    .array(anglerSchema)
    .min(MIN_ANGLERS, `At least ${MIN_ANGLERS} anglers required`)
    .max(MAX_ANGLERS, `At most ${MAX_ANGLERS} anglers allowed`),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type AdminTeamUpdateInput = z.infer<typeof adminTeamUpdateSchema>;
export type TeamRosterInput = z.infer<typeof teamRosterSchema>;
