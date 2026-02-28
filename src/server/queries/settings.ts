import { prisma } from '@/server/db';
import { changePasswordSchema, updateProfileSchema } from '@/lib/validations/settings';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function updateProfile(userId: number, input: unknown) {
  const data = updateProfileSchema.parse(input);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      timezone: data.timezone,
      phone: data.phone,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      timezone: true,
      phone: true,
      role: true,
    },
  });

  return updated;
}

export async function changePassword(userId: number, input: unknown) {
  const data = changePasswordSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const matches = await verifyPassword(data.currentPassword, user.passwordHash);
  if (!matches) {
    throw new Error('Current password is incorrect');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(data.newPassword),
    },
  });
}
