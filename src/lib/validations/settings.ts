import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  username: z.string().min(3, 'Username is required'),
  email: z.string().email('Invalid email'),
  timezone: z.string().min(1),
  phone: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
