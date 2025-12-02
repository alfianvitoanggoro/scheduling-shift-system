import { prisma } from '@/server/db';
import { EmploymentType, Role, UserStatus, type Prisma } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import {
  employeeFiltersSchema,
  employeeMutationSchema,
  type EmployeeFiltersInput,
  type EmployeeMutationInput,
} from '@/lib/validations/employees';
import type { EmployeeDirectory, EmployeeDirectoryRow } from '@/types/employees';

const FALLBACK_DIRECTORY: EmployeeDirectory = {
  total: 0,
  active: 0,
  rows: [],
};

const mapEmployeeRecord = (employee: Prisma.User): EmployeeDirectoryRow => ({
  id: employee.id,
  name: employee.name,
  username: employee.username,
  email: employee.email,
  role: employee.role,
  status: employee.status,
  timezone: employee.timezone,
  employmentType: employee.employmentType,
  skills: employee.skills ?? [],
});

export async function listEmployees(rawFilters: Partial<EmployeeFiltersInput> = {}): Promise<EmployeeDirectoryRow[]> {
  const filters = employeeFiltersSchema.parse(rawFilters);

  const where: Prisma.UserWhereInput = {
    role: { in: [Role.ADMIN, Role.EMPLOYEE] },
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.employmentType ? { employmentType: filters.employmentType } : {}),
  };

  const employees = await prisma.user.findMany({
    where,
    orderBy: [{ name: 'asc' }],
  });

  const filtered = filters.skill
    ? employees.filter((employee) =>
        employee.skills?.some((skill) => skill.toLowerCase().includes(filters.skill!.toLowerCase())),
      )
    : employees;

  return filtered.map(mapEmployeeRecord);
}

export async function getEmployeeDirectory(filters: Partial<EmployeeFiltersInput> = {}): Promise<EmployeeDirectory> {
  try {
    const rows = await listEmployees(filters);
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === UserStatus.ACTIVE).length,
      rows,
    };
  } catch (error) {
    console.warn('Unable to load employee directory', error);
    return FALLBACK_DIRECTORY;
  }
}

export async function createEmployee(rawInput: EmployeeMutationInput) {
  const data = employeeMutationSchema.parse(rawInput);
  const employee = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      timezone: data.timezone || 'UTC',
      passwordHash: await hashPassword('12345678'),
      employmentType: data.employmentType ?? EmploymentType.FULL_TIME,
      skills: data.skills ?? [],
    },
  });

  return mapEmployeeRecord(employee);
}

export async function updateEmployee(rawInput: EmployeeMutationInput & { id: number }) {
  const data = employeeMutationSchema.parse(rawInput);
  if (!rawInput.id) {
    throw new Error('Employee id is required');
  }

  const employee = await prisma.user.update({
    where: { id: rawInput.id },
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      timezone: data.timezone || 'UTC',
      employmentType: data.employmentType ?? EmploymentType.FULL_TIME,
      ...(data.skills ? { skills: data.skills } : {}),
    },
  });

  return mapEmployeeRecord(employee);
}

export async function deleteEmployee(id: number) {
  await prisma.shiftAssignment.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}
