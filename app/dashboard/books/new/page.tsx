import BackButton from '@/app/components/BackButton';
import BookForm from '@/app/components/forms/BookForm';
import { requireAuth } from '@/app/lib/auth/helpers';

const AddBook = async () => {
  // Get user session
  const session = await requireAuth();

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
