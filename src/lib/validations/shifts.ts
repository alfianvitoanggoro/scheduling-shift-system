import { z } from 'zod';
import { ShiftSlot, ShiftStatus } from '@prisma/client';

export const shiftFiltersSchema = z.object({
  shiftSlot: z.nativeEnum(ShiftSlot).optional(),
  status: z
    .array(z.nativeEnum(ShiftStatus))
    .optional()
    .default([]),
  from: z.string().optional(),
  to: z.string().optional(),
  assigneeId: z.number().int().optional(),
});

export type ShiftFiltersInput = z.infer<typeof shiftFiltersSchema>;
export type ShiftFilterState = ShiftFiltersInput;

export const shiftMutationSchema = z.object({
  id: z.number().int().optional(),
  date: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Select a valid date' }),
  shiftSlot: z.nativeEnum(ShiftSlot).default(ShiftSlot.SHIFT1),
  status: z.nativeEnum(ShiftStatus),
  notes: z.string().optional().nullable(),
  assigneeId: z.number().int().optional().nullable(),
});

export type ShiftMutationInput = z.infer<typeof shiftMutationSchema>;
