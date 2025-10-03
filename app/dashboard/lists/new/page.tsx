import BackButton from '@/app/components/BackButton';
import ListForm from '@/app/components/forms/ListForm';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AddList = async () => {
  // Get user session
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <div className='flex items-start justify-center'>
        <ListForm userRole={session.role} storeId={session.storeId} />
      </div>
    </div>
  );
};

export default AddList;
