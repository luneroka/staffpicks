import React from 'react';
import { requireAdminAccess } from '@/app/lib/auth/helpers';
import Link from 'next/link';
import { UserRole } from '@/app/lib/models/User';

const Settings = async () => {
  // Require admin access (CompanyAdmin, StoreAdmin, or Platform Admin)
  const session = await requireAdminAccess();

  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-3xl font-bold'>Paramètres</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Company Settings - Only for Company Admins */}
        {(session.role === UserRole.Admin ||
          session.role === UserRole.CompanyAdmin) && (
          <Link href='/dashboard/settings/company'>
            <div className='card bg-base-200 shadow-xl hover:bg-base-300 transition-all cursor-pointer'>
              <div className='card-body'>
                <h2 className='card-title'>Paramètres de l&apos;entreprise</h2>
                <p>
                  Gérer les informations et la configuration de votre entreprise
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Users Settings - For Company Admins and Store Admins */}
        {(session.role === UserRole.Admin ||
          session.role === UserRole.CompanyAdmin ||
          session.role === UserRole.StoreAdmin) && (
          <Link href='/dashboard/settings/users'>
            <div className='card bg-base-200 shadow-xl hover:bg-base-300 transition-all cursor-pointer'>
              <div className='card-body'>
                <h2 className='card-title'>Gestion des utilisateurs</h2>
                <p>Gérer les utilisateurs et leurs permissions</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Settings;
