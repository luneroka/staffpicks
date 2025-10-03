import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import connectDB from '@/app/lib/mongodb';
import BackButton from '@/app/components/BackButton';
import UserSettingsForm from '@/app/components/forms/UserSettingsForm';
import DeleteUserButton from '@/app/components/users/DeleteUserButton';

export const metadata: Metadata = {
  title: 'Détails utilisateur - StaffPicks',
  description: "Voir et modifier les informations de l'utilisateur",
};

async function getUser(userId: string, session: SessionData) {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    // Build query with authorization
    const query: any = { _id: new Types.ObjectId(userId) };

    // Apply role-based filtering
    if (session.role === UserRole.CompanyAdmin) {
      query.companyId = new Types.ObjectId(session.companyId!);
    } else if (session.role === UserRole.StoreAdmin) {
      query.storeId = new Types.ObjectId(session.storeId!);
      query.role = UserRole.Librarian;
    }

    const user = await UserModel.findOne(query)
      .populate('storeId', 'name code')
      .lean();

    if (!user) {
      return null;
    }

    return {
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
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
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

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const userData = await getUser(id, session);

  if (!userData) {
    notFound();
  }

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
