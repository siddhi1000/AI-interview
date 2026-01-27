
export type UserRole = 'admin' | 'candidate';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
}
