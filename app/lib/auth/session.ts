import { SessionOptions } from 'iron-session';
import { UserRole } from '../models/User';

export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
  isLoggedIn: boolean;
  role: UserRole;
  companyId?: string; // null for platform admin
  storeId?: string; // null for company admin, set for store admin/librarian
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'staffpicks-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 2, // 2 hours
    sameSite: 'strict', // CSRF protection via SameSite
  },
};

// Default session data
export const defaultSession: SessionData = {
  isLoggedIn: false,
  role: UserRole.Librarian, // default lowest privilege
  companyId: undefined,
  storeId: undefined,
};
