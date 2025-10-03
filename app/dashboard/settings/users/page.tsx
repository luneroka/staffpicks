import { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import connectDB from '@/app/lib/mongodb';
import UsersClient from './UsersClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Gestion des utilisateurs - StaffPicks',
  description: 'Gérer les utilisateurs de votre entreprise',
};

async function getUsers(session: SessionData) {
  try {
    await connectDB();

    // Build query based on role
    let query: any = {};

    if (session.role === UserRole.Admin) {
      // Platform Admin can see all users
    } else if (session.role === UserRole.CompanyAdmin) {
      // Company Admin sees users in their company
      query.companyId = new Types.ObjectId(session.companyId!);
    } else if (session.role === UserRole.StoreAdmin) {
      // Store Admin sees StoreAdmins and Librarians in their store
      query.storeId = new Types.ObjectId(session.storeId!);
      query.role = { $in: [UserRole.StoreAdmin, UserRole.Librarian] };
    }

    // Fetch users with store information
    const users = await UserModel.find(query)
      .populate('storeId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Transform users for client
    return users.map((user: any) => ({
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      storeId: user.storeId?._id?.toString(),
      storeName: user.storeId?.name,
      storeCode: user.storeId?.code,
      sections: user.sections || [],
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt?.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export default async function UsersPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  // Only Admin, CompanyAdmin, and StoreAdmin can access this page
  if (
    session.role !== UserRole.Admin &&
    session.role !== UserRole.CompanyAdmin &&
    session.role !== UserRole.StoreAdmin
  ) {
    redirect('/unauthorized');
  }

  const users = await getUsers(session);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersClient users={users} userRole={session.role} />
    </Suspense>
  );
}
