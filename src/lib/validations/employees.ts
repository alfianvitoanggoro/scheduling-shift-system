import { z } from 'zod';
import { EmploymentType, Role, UserStatus } from '@prisma/client';

export const employeeFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  skill: z.string().optional(),
});

export type EmployeeFiltersInput = z.infer<typeof employeeFiltersSchema>;

export const employeeMutationSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username is required'),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  timezone: z.string().min(1).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
});

export type EmployeeMutationInput = z.infer<typeof employeeMutationSchema>;
