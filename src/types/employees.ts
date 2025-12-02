import { EmploymentType, Role, UserStatus } from "@prisma/client";

export type EmployeeDirectoryRow = {
  id: number;
  name: string | null;
  username: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  timezone: string;
  employmentType?: EmploymentType;
  skills: string[];
};

export type EmployeeFilterState = {
  search?: string;
  role?: Role;
  status?: UserStatus;
  employmentType?: EmploymentType;
  skill?: string;
};

export type EmployeeDirectory = {
  total: number;
  active: number;
  rows: EmployeeDirectoryRow[];
};
