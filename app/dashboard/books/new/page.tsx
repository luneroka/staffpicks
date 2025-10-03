import BackButton from '@/app/components/BackButton';
import BookForm from '@/app/components/forms/BookForm';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AddBook = async () => {
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
        <BookForm userRole={session.role} storeId={session.storeId} />
      </div>
    </div>
  );
};

export default AddBook;
