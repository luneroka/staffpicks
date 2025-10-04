import BackButton from '@/app/components/BackButton';
import ListForm from '@/app/components/forms/ListForm';
import { requireAuth } from '@/app/lib/auth/helpers';

const AddList = async () => {
  // Get user session
  const session = await requireAuth();

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
