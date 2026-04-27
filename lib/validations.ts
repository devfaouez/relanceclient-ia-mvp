import { z } from "zod";
import { ProspectStatus, QuoteStatus, ReminderStatus } from "@prisma/client";

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
});

export const createProspectSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().nullish(),
  phone: z.string().trim().max(50).nullish(),
  company: z.string().trim().max(255).nullish(),
  status: z.nativeEnum(ProspectStatus).optional(),
});

export const updateProspectSchema = createProspectSchema.partial();

export const createQuoteSchema = z.object({
  title: z.string().trim().min(1).max(255),
  quoteNumber: z.string().trim().max(100).nullish(),
  amount: z.number().nonnegative().nullish(),
  currency: z.string().trim().length(3).optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
  sentAt: z.coerce.date().nullish(),
  acceptedAt: z.coerce.date().nullish(),
  rejectedAt: z.coerce.date().nullish(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const generateReminderSchema = z.object({
  quoteId: z.string().min(1),
  templateId: z.string().nullish(),
});

export const updateReminderSchema = z.object({
  subject: z.string().trim().min(1).max(500).optional(),
  body: z.string().trim().min(1).optional(),
  status: z
    .nativeEnum(ReminderStatus)
    .refine((s) => s !== ReminderStatus.SENT, {
      message: "Cannot manually set status to SENT",
    })
    .optional(),
  scheduledAt: z.coerce.date().nullish(),
  templateId: z.string().nullish(),
});

export const sendReminderSchema = z.object({
  reminderId: z.string().min(1),
});
