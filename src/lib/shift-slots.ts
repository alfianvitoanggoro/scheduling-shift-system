import { ShiftSlot } from '@prisma/client';

const SLOT_DEFINITIONS: Record<ShiftSlot, { label: string; startHour: number; endHour: number }> = {
  [ShiftSlot.SHIFT1]: {
    label: 'Shift 1 (08:00 - 17:00)',
    startHour: 8,
    endHour: 17,
  },
  [ShiftSlot.SHIFT2]: {
    label: 'Shift 2 (17:00 - 24:00)',
    startHour: 17,
    endHour: 24,
  },
};

export function getShiftSlotDefinition(slot: ShiftSlot) {
  return SLOT_DEFINITIONS[slot];
}

export function formatShiftSlotLabel(slot: ShiftSlot) {
  return SLOT_DEFINITIONS[slot].label;
}

export function deriveShiftSlotFromDate(date: Date): ShiftSlot {
  const hours = date.getHours();
  if (hours < SLOT_DEFINITIONS[ShiftSlot.SHIFT2].startHour) {
    return ShiftSlot.SHIFT1;
  }
  return ShiftSlot.SHIFT2;
}

export function getShiftWindow(dateInput: string | Date, slot: ShiftSlot) {
  const base = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00`) : dateInput;
  const start = new Date(base);
  const definition = getShiftSlotDefinition(slot);
  start.setHours(definition.startHour, 0, 0, 0);

  const end = new Date(base);
  if (definition.endHour >= 24) {
    end.setDate(end.getDate() + 1);
    end.setHours(definition.endHour - 24, 0, 0, 0);
  } else {
    end.setHours(definition.endHour, 0, 0, 0);
  }

  return { start, end };
}

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
