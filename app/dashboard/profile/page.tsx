import ProfileSettingsForm from '@/app/components/forms/ProfileSettingsForm';

const ProfilePage = async () => {
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
