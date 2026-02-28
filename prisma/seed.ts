/* eslint-disable no-console */
import { addDays, subDays, set } from "date-fns";
import {
  PrismaClient,
  Role,
  EmploymentType,
  AssignmentRole,
  ShiftStatus,
  RequestStatus,
  ShiftSlot,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── helpers ────────────────────────────────────────────────────
function shiftWindow(date: Date, slot: ShiftSlot) {
  const base = new Date(date);
  if (slot === ShiftSlot.SHIFT1) {
    return {
      start: set(base, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }),
      end: set(base, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }),
    };
  }
  return {
    start: set(base, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }),
    end: set(base, { hours: 23, minutes: 59, seconds: 59, milliseconds: 0 }),
  };
}

// ── seed users ─────────────────────────────────────────────────
async function seedUsers() {
  const hash = await bcrypt.hash("password123", 10);

  const usersData = [
    // ─── admins ───
    {
      email: "admin@example.com",
      username: "admin",
      passwordHash: hash,
      name: "Ahmad Fauzi",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567890",
      employmentType: EmploymentType.FULL_TIME,
      skills: ["Leadership", "Scheduling", "Operations"],
    },
    {
      email: "manager@example.com",
      username: "manager",
      passwordHash: hash,
      name: "Siti Rahayu",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567891",
      employmentType: EmploymentType.FULL_TIME,
      skills: ["Leadership", "HR Management"],
    },
    // ─── employees ───
    {
      email: "budi@example.com",
      username: "budi",
      passwordHash: hash,
      name: "Budi Santoso",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567892",
      employmentType: EmploymentType.FULL_TIME,
      skills: ["Customer Support", "Live Chat", "Ticketing"],
    },
    {
      email: "dewi@example.com",
      username: "dewi",
      passwordHash: hash,
      name: "Dewi Lestari",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567893",
      employmentType: EmploymentType.FULL_TIME,
      skills: ["Customer Support", "Phone Support"],
    },
    {
      email: "eko@example.com",
      username: "eko",
      passwordHash: hash,
      name: "Eko Prasetyo",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567894",
      employmentType: EmploymentType.PART_TIME,
      skills: ["Technical Support", "Networking"],
    },
    {
      email: "fitri@example.com",
      username: "fitri",
      passwordHash: hash,
      name: "Fitri Handayani",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567895",
      employmentType: EmploymentType.FULL_TIME,
      skills: ["Customer Support", "Email Support", "Live Chat"],
    },
    {
      email: "gunawan@example.com",
      username: "gunawan",
      passwordHash: hash,
      name: "Gunawan Wijaya",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567896",
      employmentType: EmploymentType.CONTRACTOR,
      skills: ["Technical Support", "Server Maintenance"],
    },
    {
      email: "hana@example.com",
      username: "hana",
      passwordHash: hash,
      name: "Hana Permata",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567897",
      employmentType: EmploymentType.FULL_TIME,
      skills: ["Customer Support", "Billing"],
    },
    {
      email: "irfan@example.com",
      username: "irfan",
      passwordHash: hash,
      name: "Irfan Hakim",
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567898",
      employmentType: EmploymentType.PART_TIME,
      skills: ["Live Chat", "Social Media Support"],
    },
    {
      email: "joko@example.com",
      username: "joko",
      passwordHash: hash,
      name: "Joko Susilo",
      role: Role.EMPLOYEE,
      status: UserStatus.INACTIVE,
      timezone: "Asia/Jakarta",
      phone: "+6281234567899",
      employmentType: EmploymentType.TEMPORARY,
      skills: ["Data Entry"],
    },
  ];

  const users = [];
  for (const data of usersData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    });
    users.push(user);
  }

  console.log(`✅  Seeded ${users.length} users`);
  return users;
}

// ── seed shifts ────────────────────────────────────────────────
async function seedShifts(employeeIds: number[], adminId: number) {
  // Clean existing data
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();

  const today = new Date();
  const shifts = [];

  // Generate shifts for the past 7 days + next 14 days = 21 days total
  for (let dayOffset = -7; dayOffset <= 14; dayOffset++) {
    const date = addDays(today, dayOffset);

    for (const slot of [ShiftSlot.SHIFT1, ShiftSlot.SHIFT2]) {
      const { start, end } = shiftWindow(date, slot);

      // Past shifts are published, future shifts are a mix
      let status: ShiftStatus;
      if (dayOffset < 0) {
        status = ShiftStatus.PUBLISHED;
      } else if (dayOffset <= 3) {
        status = ShiftStatus.PUBLISHED;
      } else if (dayOffset <= 10) {
        status =
          Math.random() > 0.3 ? ShiftStatus.PUBLISHED : ShiftStatus.DRAFT;
      } else {
        status = ShiftStatus.DRAFT;
      }

      // Occasionally cancel a shift
      if (dayOffset > 5 && Math.random() < 0.08) {
        status = ShiftStatus.CANCELLED;
      }

      const shift = await prisma.shift.create({
        data: {
          shiftSlot: slot,
          start,
          end,
          status,
          notes:
            dayOffset === 0
              ? "Today's shift — ensure full coverage"
              : dayOffset === 1
                ? "Tomorrow — double-check staffing"
                : null,
        },
      });
      shifts.push(shift);
    }
  }

  console.log(`✅  Seeded ${shifts.length} shifts`);

  // ── assign employees to shifts ───────────────────────────────
  let assignmentCount = 0;
  const activeEmployees = employeeIds.filter(
    (_, i) => i < employeeIds.length - 1,
  ); // skip inactive

  for (const shift of shifts) {
    // Assign 2-3 employees per shift
    const shuffled = [...activeEmployees].sort(() => Math.random() - 0.5);
    const assignCount = Math.min(
      2 + Math.floor(Math.random() * 2),
      shuffled.length,
    );

    for (let i = 0; i < assignCount; i++) {
      const role =
        i === 0
          ? AssignmentRole.PRIMARY
          : i === 1
            ? AssignmentRole.BACKUP
            : AssignmentRole.SHADOW;

      await prisma.shiftAssignment.create({
        data: {
          shiftId: shift.id,
          userId: shuffled[i],
          role,
          notes: role === AssignmentRole.SHADOW ? "Training / shadowing" : null,
        },
      });
      assignmentCount++;
    }
  }

  console.log(`✅  Seeded ${assignmentCount} shift assignments`);
}

// ── seed unavailability requests ───────────────────────────────
async function seedUnavailability(employeeIds: number[], adminId: number) {
  await prisma.unavailabilityRequest.deleteMany();

  const reasons = [
    "Doctor appointment",
    "Family event",
    "Personal errand",
    "College exam",
    "Religious holiday",
    "Sick leave",
    "Child school event",
    "Visa / immigration appointment",
    "Home renovation work",
    "Travel plans",
  ];

  const reviewNotes = [
    "Approved — please inform your team lead",
    "Enjoy the time off!",
    "Make sure handover is complete beforehand",
    "Approved, shift covered by another employee",
  ];

  const declineNotes = [
    "Insufficient staffing on that date — please reschedule",
    "Peak period — unable to approve",
  ];

  let count = 0;
  const today = new Date();

  for (const empId of employeeIds) {
    // Each employee gets 2-4 requests across different dates
    const numRequests = 2 + Math.floor(Math.random() * 3);

    for (let r = 0; r < numRequests; r++) {
      const dayOffset = -5 + Math.floor(Math.random() * 25); // -5 to +19 days
      const date = addDays(today, dayOffset);
      const slot = Math.random() > 0.5 ? ShiftSlot.SHIFT1 : ShiftSlot.SHIFT2;
      const reason = reasons[Math.floor(Math.random() * reasons.length)];

      // Determine status based on date
      let status: RequestStatus;
      let reviewedById: number | null = null;
      let reviewNote: string | null = null;

      if (dayOffset < -2) {
        // Past requests — mostly resolved
        const roll = Math.random();
        if (roll < 0.6) {
          status = RequestStatus.APPROVED;
          reviewedById = adminId;
          reviewNote =
            reviewNotes[Math.floor(Math.random() * reviewNotes.length)];
        } else if (roll < 0.85) {
          status = RequestStatus.DECLINED;
          reviewedById = adminId;
          reviewNote =
            declineNotes[Math.floor(Math.random() * declineNotes.length)];
        } else {
          status = RequestStatus.CANCELLED;
        }
      } else if (dayOffset < 3) {
        // Near-future — mix of open and reviewed
        const roll = Math.random();
        if (roll < 0.4) {
          status = RequestStatus.OPEN;
        } else if (roll < 0.7) {
          status = RequestStatus.UNDER_REVIEW;
        } else {
          status = RequestStatus.APPROVED;
          reviewedById = adminId;
          reviewNote =
            reviewNotes[Math.floor(Math.random() * reviewNotes.length)];
        }
      } else {
        // Further future — mostly open
        status =
          Math.random() < 0.7 ? RequestStatus.OPEN : RequestStatus.UNDER_REVIEW;
      }

      await prisma.unavailabilityRequest.create({
        data: {
          userId: empId,
          date,
          shiftSlot: slot,
          reason,
          status,
          reviewedById,
          reviewNote,
        },
      });
      count++;
    }
  }

  console.log(`✅  Seeded ${count} unavailability requests`);
}

// ── main ───────────────────────────────────────────────────────
async function main() {
  console.log("🌱  Seeding Supabase PostgreSQL database…\n");

  const users = await seedUsers();

  const adminId = users.find((u) => u.role === Role.ADMIN)!.id;
  const employeeIds = users
    .filter((u) => u.role === Role.EMPLOYEE)
    .map((u) => u.id);

  await seedShifts(employeeIds, adminId);
  await seedUnavailability(employeeIds, adminId);

  console.log("\n🎉  Seeding complete!");
  console.log("────────────────────────────────────────");
  console.log("Login credentials (all users):");
  console.log("  Password : password123");
  console.log("  Admin    : admin@example.com");
  console.log("  Employee : budi@example.com (or any other employee email)");
  console.log("────────────────────────────────────────");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌  Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
