import { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import BackButton from '@/app/components/BackButton';
import UserSettingsForm from '@/app/components/forms/UserSettingsForm';

export const metadata: Metadata = {
  title: 'Nouvel utilisateur - StaffPicks',
  description: 'Créer un nouvel utilisateur',
};

export default async function NewUserPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <div className='space-y-6'>
      <BackButton />
      <UserSettingsForm
        mode='create'
        currentUserRole={session.role}
        currentUserStoreId={session.storeId}
      />
    </div>
  );
}
