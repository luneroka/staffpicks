import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData, defaultSession } from './session';
import { UserRole } from '../types/user';
import { UserModel } from '../models/User';
import connectDB from '../mongodb';

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

async function validateUserStatus(userId: string) {
  await connectDB();
  const user = await UserModel.findById(userId);

  if (!user || user.deletedAt || user.status !== 'active') {
    // Destroy session
    const session = await getSession();
    session.destroy();
    redirect('/login');
  }
}

/** Require authentication; redirect to /login if not logged in */
export async function requireAuth() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  // Validate user status
  await validateUserStatus(session.userId);

  return session;
}

/** Require platform admin role */
export async function requirePlatformAdmin() {
  const session = await requireAuth();

  if (session.role !== UserRole.Admin) {
    redirect('/unauthorized');
  }

  return session;
}

/** Require company admin or higher access */
export async function requireCompanyAdmin() {
  const session = await requireAuth();

  if (
    session.role !== UserRole.Admin &&
    session.role !== UserRole.CompanyAdmin
  ) {
    redirect('/unauthorized');
  }

  return session;
}

/** Require company admin or store admin access (excludes librarians) */
export async function requireAdminAccess() {
  const session = await requireAuth();

  if (
    session.role !== UserRole.Admin &&
    session.role !== UserRole.CompanyAdmin &&
    session.role !== UserRole.StoreAdmin
  ) {
    redirect('/unauthorized');
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
    redirect('/unauthorized');
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
    redirect('/unauthorized');
  }

  return session;
}

/** Check if user is admin of their company */
export function isAdmin(session: SessionData): boolean {
  return session.role === UserRole.Admin;
}

/** Check if user is admin of their company */
export function isCompanyAdmin(session: SessionData): boolean {
  return session.role === UserRole.CompanyAdmin;
}

/** Check if user is admin of their company */
export function isStoreAdmin(session: SessionData): boolean {
  return session.role === UserRole.StoreAdmin;
}

/** Check if user is an admin */
export function isAnAdmin(session: SessionData): boolean {
  return (
    session.role === UserRole.Admin ||
    session.role === UserRole.CompanyAdmin ||
    session.role === UserRole.StoreAdmin
  );
}

/** Check if user is admin of their company */
export function isLibrarian(session: SessionData): boolean {
  return session.role === UserRole.Librarian;
}
