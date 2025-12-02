-- CreateEnum
CREATE TYPE "ShiftSlot" AS ENUM ('SHIFT1', 'SHIFT2');

-- CreateTable
CREATE TABLE "unavailability_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftSlot" "ShiftSlot" NOT NULL,
    "reason" TEXT,
    "documentUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unavailability_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unavailability_requests_userId_idx" ON "unavailability_requests"("userId");

-- CreateIndex
CREATE INDEX "unavailability_requests_status_idx" ON "unavailability_requests"("status");

-- AddForeignKey
ALTER TABLE "unavailability_requests" ADD CONSTRAINT "unavailability_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unavailability_requests" ADD CONSTRAINT "unavailability_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
