import { Metadata } from 'next';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import connectDB from '@/app/lib/mongodb';
import UsersClient from './UsersClient';
import { Suspense } from 'react';
import {
  requireAdminAccess,
  isAdmin,
  isCompanyAdmin,
  isStoreAdmin,
} from '@/app/lib/auth/helpers';

export const metadata: Metadata = {
  title: 'Gestion des utilisateurs - StaffPicks',
  description: 'Gérer les utilisateurs de votre entreprise',
};

export default async function UsersPage() {
  // Require Admin, CompanyAdmin, or StoreAdmin access
  const session = await requireAdminAccess();

  await connectDB();

  // Build query based on role
  let query: any = {
    deletedAt: { $exists: false },
  };

  if (isAdmin(session)) {
    // Platform Admin can see all users
  } else if (isCompanyAdmin(session)) {
    // Company Admin sees users in their company
    query.companyId = new Types.ObjectId(session.companyId!);
  } else if (isStoreAdmin(session)) {
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
  const usersData = users.map((user: any) => ({
    _id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    storeId: user.storeId?._id?.toString(),
    storeName: user.storeId?.name,
    storeCode: user.storeId?.code,
    sections: user.sections || [],
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt?.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  }));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersClient users={usersData} userRole={session.role} />
    </Suspense>
  );
}
