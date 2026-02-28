-- Recreate core tables with integer auto-incrementing ids
DROP TABLE IF EXISTS "shift_assignments" CASCADE;
DROP TABLE IF EXISTS "unavailability_requests" CASCADE;
DROP TABLE IF EXISTS "shifts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "username" TEXT,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "phone" TEXT,
  "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username") WHERE "username" IS NOT NULL;
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_status_idx" ON "users"("status");

CREATE TABLE "shifts" (
  "id" SERIAL PRIMARY KEY,
  "shiftSlot" "ShiftSlot" NOT NULL DEFAULT 'SHIFT1',
  "start" TIMESTAMP(3) NOT NULL,
  "end" TIMESTAMP(3) NOT NULL,
  "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "shifts_start_idx" ON "shifts"("start");
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

CREATE TABLE "shift_assignments" (
  "id" SERIAL PRIMARY KEY,
  "shiftId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "role" "AssignmentRole" NOT NULL DEFAULT 'PRIMARY',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "shift_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "shift_assignments_shiftId_userId_role_key" ON "shift_assignments"("shiftId", "userId", "role");

CREATE TABLE "unavailability_requests" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "shiftSlot" "ShiftSlot" NOT NULL,
  "reason" TEXT,
  "documentUrl" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
  "reviewNote" TEXT,
  "reviewedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "unavailability_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "unavailability_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "unavailability_requests_userId_idx" ON "unavailability_requests"("userId");
CREATE INDEX "unavailability_requests_status_idx" ON "unavailability_requests"("status");
