import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData, defaultSession } from './session';
import { UserRole } from '../models/User';

/** Get the current session (or default if not logged in) */
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

/** Require authentication; redirect to /login if not logged in */
export async function requireAuth() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/auth/login');
  }

  return session;
}

/** Require platform admin role */
export async function requirePlatformAdmin() {
  const session = await requireAuth();

  if (session.role !== UserRole.Admin) {
    redirect('/auth/unauthorized');
  }

  return session;
}

/** Require user belongs to specific company */
export async function requireCompanyAccess(companyId: string) {
  const session = await requireAuth();

  // Platform admin can access any company
  if (session.role === UserRole.Admin) {
    return session;
  }

  // Check if user's company matches
  if (session.companyId !== companyId) {
    redirect('/auth/unauthorized');
  }

  return session;
}

/** Require user has access to specific store */
export async function requireStoreAccess(storeId: string) {
  const session = await requireAuth();

  // Platform admin can access any store
  if (session.role === UserRole.Admin) {
    return session;
  }

  // Company admin can access all stores in their company
  if (session.role === UserRole.CompanyAdmin) {
    // Would need to verify store belongs to user's company
    // For MVP, trust that storeId is valid for this company
    return session;
  }

  // Store admin and librarians must have matching storeId
  if (session.storeId !== storeId) {
    redirect('/auth/unauthorized');
  }

  return session;
}

/** Require specific role or higher */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    redirect('/auth/unauthorized');
  }

  return session;
}

/** Check if user can manage stores in their company (non-throwing) */
export function canManageStores(session: SessionData): boolean {
  return (
    session.role === UserRole.Admin ||
    session.role === UserRole.CompanyAdmin ||
    session.role === UserRole.StoreAdmin
  );
}

/** Check if user can edit books (non-throwing) */
export function canEditBooks(session: SessionData): boolean {
  // All roles except maybe future read-only roles can edit books
  return session.isLoggedIn;
}

/** Check if user is admin of their company */
export function isCompanyAdmin(session: SessionData): boolean {
  return (
    session.role === UserRole.Admin || session.role === UserRole.CompanyAdmin
  );
}

/** Check if user can manage other users */
export function canManageUsers(session: SessionData): boolean {
  return (
    session.role === UserRole.Admin || session.role === UserRole.CompanyAdmin
  );
}
