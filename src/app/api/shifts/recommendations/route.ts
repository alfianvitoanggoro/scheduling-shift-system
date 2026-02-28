import { NextResponse } from 'next/server';
import { ShiftSlot } from '@prisma/client';
import { recommendAssignees } from '@/server/queries/shifts';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { date, shiftSlot } = payload;

    if (!date || !shiftSlot) {
      return NextResponse.json({ error: 'date and shiftSlot are required' }, { status: 400 });
    }

    const normalizedSlot = Object.values(ShiftSlot).includes(shiftSlot as ShiftSlot)
      ? (shiftSlot as ShiftSlot)
      : null;

    if (!normalizedSlot) {
      return NextResponse.json({ error: 'Invalid shift slot' }, { status: 400 });
    }

    const data = await recommendAssignees({
      date: new Date(`${date}T00:00:00`),
      shiftSlot: normalizedSlot,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to recommend assignees', error);
    return NextResponse.json({ error: 'Failed to recommend assignees' }, { status: 500 });
  }
}
