import React from 'react';
import { requireAdminAccess } from '@/app/lib/auth/helpers';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const UsersSettings = async () => {
  // Require admin access (CompanyAdmin, StoreAdmin, or Platform Admin)
  await requireAdminAccess();

  return (
    <div className='flex flex-col'>
      <Link href='/dashboard/settings/'>
        <button className='btn btn-ghost mb-4'>
          <FaArrowLeft />
          Retour
        </button>
      </Link>
      <div className='flex flex-col gap-8'>
        <h1 className='text-3xl font-bold'>Gestion des utilisateurs</h1>

        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <p>Fonctionnalité à venir...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersSettings;
