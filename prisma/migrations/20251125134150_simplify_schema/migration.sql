/*
  Warnings:

  - The values [MANAGER,SCHEDULER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `scheduleRuleId` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerFeedback` on the `unavailability_requests` table. All the data in the column will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_change_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `time_off_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- Normalize existing role values before altering enum
UPDATE "public"."users" SET "role" = 'ADMIN' WHERE "role" IN ('MANAGER', 'SCHEDULER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'EMPLOYEE');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actorId_fkey";

-- DropForeignKey
ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "employee_skills" DROP CONSTRAINT "employee_skills_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_preferences" DROP CONSTRAINT "schedule_preferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_rules" DROP CONSTRAINT "schedule_rules_createdById_fkey";

-- DropForeignKey
ALTER TABLE "schedule_rules" DROP CONSTRAINT "schedule_rules_templateId_fkey";

-- DropForeignKey
ALTER TABLE "shift_change_requests" DROP CONSTRAINT "shift_change_requests_requestorId_fkey";

-- DropForeignKey
ALTER TABLE "shift_change_requests" DROP CONSTRAINT "shift_change_requests_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "shift_change_requests" DROP CONSTRAINT "shift_change_requests_shiftId_fkey";

-- DropForeignKey
ALTER TABLE "shift_change_requests" DROP CONSTRAINT "shift_change_requests_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_scheduleRuleId_fkey";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "time_off_requests_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "time_off_requests_userId_fkey";

-- AlterTable
ALTER TABLE "shifts" DROP COLUMN "scheduleRuleId";

-- AlterTable
ALTER TABLE "unavailability_requests" DROP COLUMN "reviewerFeedback";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "employee_profiles";

-- DropTable
DROP TABLE "employee_skills";

-- DropTable
DROP TABLE "schedule_preferences";

-- DropTable
DROP TABLE "schedule_rules";

-- DropTable
DROP TABLE "shift_change_requests";

-- DropTable
DROP TABLE "time_off_requests";

-- DropEnum
DROP TYPE "ShiftChangeType";

-- DropEnum
DROP TYPE "SkillProficiency";

-- DropEnum
DROP TYPE "TimeOffStatus";
