import React from 'react';
import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import CompanySettingsForm from '@/app/components/forms/CompanySettingsForm';

const CompanySettings = async () => {
  // Require company admin access only
  await requireCompanyAdmin();

  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-3xl font-bold'>Paramètres de l&apos;entreprise</h1>

      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <CompanySettingsForm />
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
