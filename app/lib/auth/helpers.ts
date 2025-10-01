import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData, defaultSession } from './session';
import { UserRole } from '../models/User';

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    redirect('/auth/login');
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user!.role)) {
    redirect('/auth/unauthorized');
  }

  return session;
}
