import { Metadata } from 'next';
import BackButton from '@/app/components/BackButton';
import UserSettingsForm from '@/app/components/forms/UserSettingsForm';
import { requireAuth } from '@/app/lib/auth/helpers';

export const metadata: Metadata = {
  title: 'Nouvel utilisateur - StaffPicks',
  description: 'Créer un nouvel utilisateur',
};

export default async function NewUserPage() {
  const session = await requireAuth();

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
