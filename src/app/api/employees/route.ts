import { NextResponse } from 'next/server';
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/server/queries/employees';
import { prisma } from '@/server/db';
import { getPayloadFromRequest } from '@/lib/auth';

async function requireAdmin(request: Request) {
  const payload = getPayloadFromRequest(request);
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const filters = {
    search: searchParams.get("search") ?? undefined,
    role: (searchParams.get("role") as any) ?? undefined,
    status: (searchParams.get("status") as any) ?? undefined,
    employmentType: (searchParams.get("employmentType") as any) ?? undefined,
    skill: searchParams.get("skill") ?? undefined,
  };

  try {
    const data = await listEmployees(filters);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to load employees", error);
    return NextResponse.json(
      { error: "Failed to load employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const payload = await request.json();
    const data = await createEmployee(payload);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Failed to create employee", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const payload = await request.json();
    const data = await updateEmployee(payload);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to update employee", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { id } = await request.json();
    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) {
      return NextResponse.json(
        { error: "Employee id is required" },
        { status: 400 }
      );
    }
    await deleteEmployee(numericId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete employee", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 400 }
    );
  }
}
