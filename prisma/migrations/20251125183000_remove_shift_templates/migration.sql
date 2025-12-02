-- Drop foreign key from shifts to shift_templates
ALTER TABLE "shifts" DROP CONSTRAINT IF EXISTS "shifts_templateId_fkey";

-- Add shiftSlot column and backfill from existing start times
ALTER TABLE "shifts" ADD COLUMN "shiftSlot" "ShiftSlot" NOT NULL DEFAULT 'SHIFT1';
UPDATE "shifts"
SET "shiftSlot" = CASE
  WHEN EXTRACT(hour FROM "start") >= 17 THEN 'SHIFT2'::"ShiftSlot"
  ELSE 'SHIFT1'::"ShiftSlot"
END;

-- Drop obsolete columns
ALTER TABLE "shifts" DROP COLUMN IF EXISTS "templateId";
ALTER TABLE "shifts" DROP COLUMN IF EXISTS "location";

-- Drop shift template table
DROP TABLE IF EXISTS "shift_templates";
