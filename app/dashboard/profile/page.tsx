import React from 'react';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import { redirect } from 'next/navigation';
import ProfileSettingsForm from '@/app/components/forms/ProfileSettingsForm';

const ProfilePage = async () => {
  // Check authentication
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-3xl font-bold'>Mon profil</h1>

      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <ProfileSettingsForm />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
