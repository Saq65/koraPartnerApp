export type UserRole = 'driver' | 'washer';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  return {
    id: 'demo-user',
    role: 'driver',
    name: 'Demo User',
  };
}

export async function logout(): Promise<void> {
  return;
}
