import { z } from "zod";
import { optionalAnglerEmailSchema } from "./angler-email";
import { contactEmailIssue } from "./boat-contact";
import { MAX_ANGLERS, MIN_ANGLERS, SIDE_POT_IDS } from "./config";
import { SHIRT_SIZE_REQUIRED_ERROR, SHIRT_SIZES } from "./shirt-size";
import {
  LICENSE_CONFIRM_ERROR,
  YOUTH_ATTESTATION_ERROR,
  youthGuardianAttestationMissing,
} from "./youth";

const anglerSchema = z.object({
  fullName: z.string().trim().min(1, "Angler name is required"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: optionalAnglerEmailSchema,
  isYouth: z.boolean().optional().default(false),
  shirtSize: z.enum(SHIRT_SIZES, { error: SHIRT_SIZE_REQUIRED_ERROR }),
});

const teamFieldsSchema = z.object({
  teamName: z.string().trim().min(1, "Team name is required"),
  boatType: z.enum(["GUIDED", "NON_GUIDED"]),
  captainName: z.string().trim().optional(),
  captainPhone: z.string().trim().optional(),
  captainEmail: optionalAnglerEmailSchema,
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

function refineOptionalContactEmail<T extends { contactEmail?: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const issue = contactEmailIssue(data.contactEmail);
  if (issue) {
    ctx.addIssue({
      code: "custom",
      path: ["contactEmail"],
      message: issue,
    });
  }
}

function refineYouthAttestation(
  data: {
    anglers: Array<{ isYouth?: boolean }>;
    youthGuardianAttested?: boolean;
  },
  ctx: z.RefinementCtx,
) {
  if (youthGuardianAttestationMissing(data.anglers, data.youthGuardianAttested)) {
    ctx.addIssue({
      code: "custom",
      path: ["youthGuardianAttested"],
      message: YOUTH_ATTESTATION_ERROR,
    });
  }
}

export const registrationSchema = teamFieldsSchema
  .extend({
    licenseConfirmed: z.literal(true, {
      error: LICENSE_CONFIRM_ERROR,
    }),
    youthGuardianAttested: z.boolean().optional(),
  })
  .superRefine(refineOptionalContactEmail)
  .superRefine(refineYouthAttestation);

export const adminTeamUpdateSchema = teamFieldsSchema
  .extend({
    licenseConfirmed: z.boolean(),
    paymentStatus: z.enum(["UNPAID", "PAID"]),
    youthGuardianAttested: z.boolean().optional(),
  })
  .superRefine(refineOptionalContactEmail);

export const teamContactSchema = z
  .object({
    boatType: z.enum(["GUIDED", "NON_GUIDED"]).optional(),
    captainName: z.string().optional(),
    captainPhone: z.string().optional(),
    captainEmail: optionalAnglerEmailSchema,
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
  })
  .superRefine(refineOptionalContactEmail);

export const teamRosterSchema = z
  .object({
    anglers: z
      .array(anglerSchema)
      .min(MIN_ANGLERS, `At least ${MIN_ANGLERS} anglers required`)
      .max(MAX_ANGLERS, `At most ${MAX_ANGLERS} anglers allowed`),
    youthGuardianAttested: z.boolean().optional(),
  })
  .superRefine(refineYouthAttestation);

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type AdminTeamUpdateInput = z.infer<typeof adminTeamUpdateSchema>;
export type TeamRosterInput = z.infer<typeof teamRosterSchema>;
export type TeamContactInput = z.infer<typeof teamContactSchema>;
