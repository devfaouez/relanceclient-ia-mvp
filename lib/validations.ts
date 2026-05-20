import { z } from "zod";
import {
  ProspectStatus,
  QuoteStatus,
  ReminderStatus,
  ReminderTone,
  TemplateStatus,
  Trade,
} from "@prisma/client";

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
  validUntil: z.coerce.date().nullish(),
  legalNotice: z.string().trim().max(2000).nullish(),
  paymentTerms: z.string().trim().max(2000).nullish(),
  sentAt: z.coerce.date().nullish(),
  acceptedAt: z.coerce.date().nullish(),
  rejectedAt: z.coerce.date().nullish(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const generateReminderSchema = z.object({
  quoteId: z.string().min(1),
  templateId: z.string().nullish(),
  userNote: z.string().trim().max(500).nullish(),
  tone: z.nativeEnum(ReminderTone).optional(),
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

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  subject: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(5000),
  status: z.nativeEnum(TemplateStatus).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const sendReminderSchema = z.object({
  reminderId: z.string().min(1),
});

export const updateCompanySettingsSchema = z.object({
  businessName: z.string().trim().max(200).nullish(),
  logoUrl: z.string().trim().max(1000).nullish(),
  companyAddress: z.string().trim().max(1000).nullish(),
  companyPhone: z.string().trim().max(100).nullish(),
  companyEmail: z.string().trim().email().max(255).nullish().or(z.literal("")),
  companyWebsite: z.string().trim().max(500).nullish(),
  trade: z.nativeEnum(Trade).nullish().or(z.literal("")),
  defaultTone: z.nativeEnum(ReminderTone).optional(),
  signatureBlock: z.string().trim().max(2000).nullish(),
  quoteFooter: z.string().trim().max(2000).nullish(),
});

export const createQuoteLineSchema = z.object({
  description: z.string().trim().min(1).max(1000),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const updateQuoteLineSchema = createQuoteLineSchema.partial();
