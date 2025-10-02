import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import StoreSettingsForm from '@/app/components/forms/StoreSettingsForm';
import { FaStore, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const NewStorePage = async () => {
  // Require company admin access
  await requireCompanyAdmin();

  return (
    <div className='space-y-6'>
      <Link href='/dashboard/settings/stores'>
        <button className='btn btn-ghost mb-4'>
          <FaArrowLeft />
          Retour
        </button>
      </Link>

      {/* Form */}
      <StoreSettingsForm mode='create' />
    </div>
  );
};

export default NewStorePage;
