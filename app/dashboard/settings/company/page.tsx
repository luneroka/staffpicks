import React from 'react';
import { requireCompanyAdmin } from '@/app/lib/auth/helpers';

const CompanySettings = async () => {
  // Require company admin access only
  await requireCompanyAdmin();

  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-3xl font-bold'>Paramètres de l&apos;entreprise</h1>

      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <p>Fonctionnalité à venir...</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
