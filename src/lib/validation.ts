import { z } from "zod";
import { optionalAnglerEmailSchema } from "./angler-email";
import { contactEmailIssue } from "./boat-contact";
import {
  ENTRY_KIND,
  MAX_YOUTH_ANGLERS,
  MIN_ANGLERS,
  MIN_YOUTH_ANGLERS,
  SIDE_POT_IDS,
} from "./config";
import {
  boatRosterCapacityIssue,
  youthLandRosterCapacityIssue,
} from "./roster-capacity";
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
  anglers: z.array(anglerSchema).min(1, `At least ${MIN_ANGLERS} anglers required`),
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

function refineBoatRosterCapacity(
  data: { anglers: Array<{ isYouth?: boolean }>; entryKind?: string },
  ctx: z.RefinementCtx,
) {
  if (data.entryKind === ENTRY_KIND.YOUTH_LAND) return;
  const issue = boatRosterCapacityIssue(data.anglers);
  if (issue) {
    ctx.addIssue({
      code: "custom",
      path: ["anglers"],
      message: issue,
    });
  }
}

function refineYouthLandRoster(
  data: { anglers: Array<{ isYouth?: boolean }> },
  ctx: z.RefinementCtx,
) {
  const issue = youthLandRosterCapacityIssue(data.anglers);
  if (issue) {
    ctx.addIssue({
      code: "custom",
      path: ["anglers"],
      message: issue,
    });
  }
}

export const registrationSchema = teamFieldsSchema
  .extend({
    licenseConfirmed: z.literal(true, {
      error: LICENSE_CONFIRM_ERROR,
    }),
    youthGuardianAttested: z.boolean().optional(),
    entryKind: z.literal(ENTRY_KIND.BOAT).optional().default(ENTRY_KIND.BOAT),
  })
  .superRefine(refineOptionalContactEmail)
  .superRefine(refineYouthAttestation)
  .superRefine(refineBoatRosterCapacity);

export const youthLandRegistrationSchema = z
  .object({
    teamName: z.string().trim().min(1, "A household or kids name is required"),
    registrantEmail: z.string().trim().email("Valid email required"),
    notes: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    anglers: z
      .array(anglerSchema)
      .min(MIN_YOUTH_ANGLERS, `At least ${MIN_YOUTH_ANGLERS} youth angler required`)
      .max(MAX_YOUTH_ANGLERS, `At most ${MAX_YOUTH_ANGLERS} youth anglers allowed`),
    licenseConfirmed: z.literal(true, {
      error: LICENSE_CONFIRM_ERROR,
    }),
    youthGuardianAttested: z.boolean().optional(),
    entryKind: z.literal(ENTRY_KIND.YOUTH_LAND).optional(),
  })
  .superRefine(refineYouthAttestation)
  .superRefine(refineYouthLandRoster);

export const adminTeamUpdateSchema = teamFieldsSchema
  .extend({
    licenseConfirmed: z.boolean(),
    paymentStatus: z.enum(["UNPAID", "PAID"]),
    youthGuardianAttested: z.boolean().optional(),
    entryKind: z.enum([ENTRY_KIND.BOAT, ENTRY_KIND.YOUTH_LAND]).optional(),
  })
  .superRefine(refineOptionalContactEmail)
  .superRefine((data, ctx) => {
    if (data.entryKind === ENTRY_KIND.YOUTH_LAND) {
      refineYouthLandRoster(data, ctx);
      return;
    }
    refineBoatRosterCapacity(data, ctx);
  });

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
    anglers: z.array(anglerSchema).min(1, `At least ${MIN_ANGLERS} anglers required`),
    youthGuardianAttested: z.boolean().optional(),
    entryKind: z.enum([ENTRY_KIND.BOAT, ENTRY_KIND.YOUTH_LAND]).optional(),
  })
  .superRefine(refineYouthAttestation)
  .superRefine((data, ctx) => {
    if (data.entryKind === ENTRY_KIND.YOUTH_LAND) {
      refineYouthLandRoster(data, ctx);
      return;
    }
    refineBoatRosterCapacity(data, ctx);
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type YouthLandRegistrationInput = z.infer<
  typeof youthLandRegistrationSchema
>;
export type AdminTeamUpdateInput = z.infer<typeof adminTeamUpdateSchema>;
export type TeamRosterInput = z.infer<typeof teamRosterSchema>;
export type TeamContactInput = z.infer<typeof teamContactSchema>;
