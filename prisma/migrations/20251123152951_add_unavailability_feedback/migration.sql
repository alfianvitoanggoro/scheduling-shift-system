-- AlterTable
ALTER TABLE "unavailability_requests" ADD COLUMN     "reviewNote" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP DEFAULT;
