import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import connectDB from '@/app/lib/mongodb';
import BackButton from '@/app/components/BackButton';
import UserSettingsForm from '@/app/components/forms/UserSettingsForm';
import DeleteUserButton from '@/app/components/users/DeleteUserButton';
import {
  requireAdminAccess,
  isCompanyAdmin,
  isStoreAdmin,
} from '@/app/lib/auth/helpers';

export const metadata: Metadata = {
  title: 'Détails utilisateur - StaffPicks',
  description: "Voir et modifier les informations de l'utilisateur",
};

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Require Admin, CompanyAdmin, or StoreAdmin access
  const session = await requireAdminAccess();

  const { id } = await params;

  if (!id) {
    notFound();
  }

  await connectDB();

  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  // Build query with authorization
  const query: any = { _id: new Types.ObjectId(id) };

  // Apply role-based filtering
  if (isCompanyAdmin(session)) {
    query.companyId = new Types.ObjectId(session.companyId!);
  } else if (isStoreAdmin(session)) {
    query.storeId = new Types.ObjectId(session.storeId!);
    query.role = UserRole.Librarian;
  }

  const user = await UserModel.findOne(query)
    .populate('storeId', 'name code')
    .lean();

  if (!user) {
    notFound();
  }

  // Transform user data for client
  const userData = {
    _id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    storeId: user.storeId?._id?.toString(),
    storeName: (user.storeId as any)?.name,
    storeCode: (user.storeId as any)?.code,
    sections: user.sections || [],
    avatarUrl: user.avatarUrl,
  };

  return (
    <div className='space-y-6'>
      <BackButton />
      <UserSettingsForm
        userId={id}
        initialData={userData}
        mode='edit'
        currentUserRole={session.role}
        currentUserStoreId={session.storeId}
        deleteButtons={
          <DeleteUserButton
            userId={id}
            userName={`${userData.firstName} ${userData.lastName}`}
            userRole={userData.role}
            currentUserRole={session.role}
            currentUserId={session.userId}
          />
        }
      />
    </div>
  );
}
