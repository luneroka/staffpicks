import { SessionOptions } from 'iron-session';
import { SessionUser } from '../models/User';

export interface SessionData {
  user?: SessionUser;
  isLoggedIn: boolean;
  companySlug?: string; // for url routing
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_COOKIE_PASSWORD!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'staffpicks-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax',
  },
};

// Default session data
export const defaultSession: SessionData = {
  isLoggedIn: false,
};
