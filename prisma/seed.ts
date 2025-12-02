/* eslint-disable no-console */
import { addDays, addHours, set } from 'date-fns';
import {
  PrismaClient,
  Role,
  EmploymentType,
  AssignmentRole,
  ShiftStatus,
  RequestStatus,
  ShiftSlot,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  const defaultPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: defaultPassword,
      name: 'System Admin',
      role: Role.ADMIN,
      timezone: 'UTC',
      employmentType: EmploymentType.FULL_TIME,
      skills: ['Leadership'],
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      username: 'employee',
      passwordHash: defaultPassword,
      name: 'Support Agent',
      role: Role.EMPLOYEE,
      timezone: 'UTC',
      employmentType: EmploymentType.PART_TIME,
      skills: ['Customer Support', 'Live Chat'],
    },
  });

  return { admin, employee };
}

async function seedShifts(employeeId: number) {
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();
  const today = new Date();
  const shiftDates = Array.from({ length: 7 }, (_, idx) => addDays(today, idx));

  for (const [index, date] of shiftDates.entries()) {
    const startBase = set(date, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 });
    const shiftStart = index % 2 === 0 ? startBase : addHours(startBase, 9);
    const shiftEnd = index % 2 === 0 ? addHours(shiftStart, 9) : addHours(shiftStart, 7);
    const slot = index % 2 === 0 ? ShiftSlot.SHIFT1 : ShiftSlot.SHIFT2;

    const shift = await prisma.shift.create({
      data: {
        shiftSlot: slot,
        start: shiftStart,
        end: shiftEnd,
        status: ShiftStatus.PUBLISHED,
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employeeId,
        role: AssignmentRole.PRIMARY,
      },
    });
  }
}

async function seedUnavailability(employeeId: number, adminId: number) {
  await prisma.unavailabilityRequest.deleteMany();

  await prisma.unavailabilityRequest.create({
    data: {
      userId: employeeId,
      date: addDays(new Date(), 3),
      shiftSlot: ShiftSlot.SHIFT1,
      reason: 'Doctor appointment',
      status: RequestStatus.OPEN,
    },
  });

  await prisma.unavailabilityRequest.create({
    data: {
      userId: employeeId,
      date: addDays(new Date(), 1),
      shiftSlot: ShiftSlot.SHIFT2,
      reason: 'Family event',
      status: RequestStatus.APPROVED,
      reviewedById: adminId,
      reviewNote: 'Enjoy the time off',
    },
  });
}

async function main() {
  const { admin, employee } = await seedUsers();
  await seedShifts(employee.id);
  await seedUnavailability(employee.id, admin.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
