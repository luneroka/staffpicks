import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import StoreSettingsForm from '@/app/components/forms/StoreSettingsForm';
import BackButton from '@/app/components/BackButton';

const NewStorePage = async () => {
  // Require company admin access
  await requireCompanyAdmin();

  return (
    <div className='space-y-6'>
      <BackButton className='mb-4 w-fit' />

      {/* Form */}
      <StoreSettingsForm mode='create' />
    </div>
  );
};

export default NewStorePage;
