export type SessionUser = {
  id: number;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  timezone: string;
  phone: string | null;
};
