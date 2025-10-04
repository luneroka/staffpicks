'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPencilAlt, FaSave, FaTimes, FaUpload, FaKey } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';
import { toast } from 'sonner';
import { useFormState, useImageUpload } from '@/app/lib/hooks';
import FormAlerts from './FormAlerts';
import Image from 'next/image';

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

const ProfileSettingsForm = () => {
  const router = useRouter();
  const { error, success, setError, setSuccess } = useFormState();

  const { handleUpload: handleAvatarUpload, isUploading: isUploadingAvatar } =
    useImageUpload({
      folder: 'user-avatars',
      successMessage: 'Avatar uploadé avec succès!',
      onSuccess: (url) => {
        setEditedData((prev) => (prev ? { ...prev, avatarUrl: url } : null));
        setSuccess('Avatar uploadé avec succès!');
      },
      onError: (error) => setError(error),
    });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setUserData(data);
      setEditedData(data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(userData);
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handlePasswordChangeSubmit = async () => {
    // Validate password fields
    if (!currentPassword) {
      setError('Le mot de passe actuel est requis');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const body = {
        currentPassword,
        newPassword,
        confirmPassword,
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Erreur lors du changement de mot de passe'
        );
      }

      // Success - reset password form
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe modifié avec succès!');

      // Log out the user before redirecting to login
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }

      // Redirect to login
      router.push('/login');
    } catch (err) {
      console.error('Error changing password:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du changement de mot de passe'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData((prev) => (prev ? { ...prev, [name]: value } : null));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedData) return;

    // Basic validation
    if (!editedData.firstName?.trim()) {
      setError('Le prénom est requis');
      return;
    }

    if (!editedData.lastName?.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (!editedData.email?.trim()) {
      setError("L'email est requis");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedData.email)) {
      setError("Format d'email invalide");
      return;
    }

    // Validate password change if requested
    if (isChangingPassword) {
      if (!currentPassword) {
        setError('Le mot de passe actuel est requis');
        return;
      }

      if (!newPassword || newPassword.length < 8) {
        setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Les nouveaux mots de passe ne correspondent pas');
        return;
      }
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const body: any = {
        firstName: editedData.firstName,
        lastName: editedData.lastName,
        email: editedData.email,
        avatarUrl: editedData.avatarUrl,
      };

      // Add password fields if changing password
      if (isChangingPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
        body.confirmPassword = confirmPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setUserData(data.user);
      setEditedData(data.user);
      setIsEditing(false);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Show success toast
      const userName = `${data.user.firstName} ${data.user.lastName}`;
      toast.success(`Profil de ${userName} mis à jour avec succès!`);

      // Refresh the page to update navbar
      router.refresh();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <span className='loading loading-spinner loading-lg'></span>
      </div>
    );
  }

  if (!userData || !editedData) {
    return (
      <div className='alert alert-soft alert-error'>
        <HiExclamationCircle className='text-xl' />
        <span>Impossible de charger les données du profil</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Success and Error Messages */}
      <FormAlerts error={error} success={success} />

      <form onSubmit={handleSubmit}>
        {/* Header with Edit/Save buttons */}
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold'>Informations personnelles</h3>
          {!isEditing ? (
            <button
              type='button'
              onClick={handleEdit}
              className='btn btn-soft btn-primary btn-sm'
            >
              <FaPencilAlt /> Modifier
            </button>
          ) : (
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={handleCancel}
                className='btn btn-ghost btn-sm'
                disabled={isSaving}
              >
                <FaTimes /> Annuler
              </button>
              <button
                type='submit'
                className='btn btn-primary btn-sm'
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className='loading loading-spinner loading-sm'></span>
                ) : (
                  <>
                    <FaSave /> Enregistrer
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Avatar Section */}
        <div className='mb-8'>
          <label className='label'>
            <span className='label-text font-semibold'>Photo de profil</span>
          </label>
          <div className='flex items-center gap-4'>
            {editedData.avatarUrl ? (
              <div className='avatar'>
                <div className='w-24 rounded-full'>
                  <Image
                    src={editedData.avatarUrl}
                    alt='Avatar'
                    width={96}
                    height={96}
                    className='object-cover'
                  />
                </div>
              </div>
            ) : (
              <div className='w-24 h-24 rounded-full bg-base-300 flex items-center justify-center'>
                <span className='text-4xl'>👤</span>
              </div>
            )}
            {isEditing && (
              <div>
                <input
                  type='file'
                  id='avatar-upload'
                  accept='image/*'
                  onChange={handleAvatarUpload}
                  className='hidden'
                  disabled={isUploadingAvatar}
                />
                <label
                  htmlFor='avatar-upload'
                  className={`btn btn-outline btn-sm ${
                    isUploadingAvatar ? 'btn-disabled' : ''
                  }`}
                >
                  {isUploadingAvatar ? (
                    <span className='loading loading-spinner loading-sm'></span>
                  ) : (
                    <>
                      <FaUpload /> Changer la photo
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* First Name */}
          <div className='form-control w-full'>
            <label className='label'>
              <span className='label-text font-semibold'>Prénom *</span>
            </label>
            {isEditing ? (
              <input
                type='text'
                name='firstName'
                value={editedData.firstName}
                onChange={handleInputChange}
                className='input input-bordered w-full'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{userData.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className='form-control w-full'>
            <label className='label'>
              <span className='label-text font-semibold'>Nom *</span>
            </label>
            {isEditing ? (
              <input
                type='text'
                name='lastName'
                value={editedData.lastName}
                onChange={handleInputChange}
                className='input input-bordered w-full'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{userData.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className='form-control md:col-span-2 w-full'>
            <label className='label'>
              <span className='label-text font-semibold'>Email *</span>
            </label>
            {isEditing ? (
              <input
                type='email'
                name='email'
                value={editedData.email}
                onChange={handleInputChange}
                className='input input-bordered w-full'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{userData.email}</p>
            )}
          </div>

          {/* Role (read-only) */}
          <div className='form-control md:col-span-2 w-full'>
            <label className='label'>
              <span className='label-text font-semibold'>Rôle</span>
            </label>
            <p className='p-3 bg-base-300 rounded-lg text-base-content/70'>
              {userData.role === 'admin' && 'Administrateur Plateforme'}
              {userData.role === 'companyAdmin' && 'Administrateur Entreprise'}
              {userData.role === 'storeAdmin' && 'Administrateur Magasin'}
              {userData.role === 'librarian' && 'Libraire'}
            </p>
          </div>
        </div>

        {/* Password Change Section */}
        <>
          <div className='divider my-8'></div>

          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-xl font-semibold'>Mot de passe</h3>
            {!isChangingPassword && (
              <button
                type='button'
                onClick={() => setIsChangingPassword(true)}
                className='btn btn-outline btn-sm'
              >
                <FaKey /> Changer le mot de passe
              </button>
            )}
          </div>

          {isChangingPassword && (
            <div className='space-y-4'>
              <div className='alert alert-soft alert-info'>
                <HiExclamationCircle />
                <span>Le mot de passe doit contenir au moins 8 caractères</span>
              </div>

              <div className='form-control w-full'>
                <input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='input input-bordered'
                  placeholder='Votre mot de passe actuel'
                />
              </div>

              <div className='form-control'>
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='input input-bordered'
                  placeholder='Minimum 8 caractères'
                />
              </div>

              <div className='form-control'>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='input input-bordered'
                  placeholder='Re-saisir le nouveau mot de passe'
                />
              </div>

              <div className='flex gap-2 mt-4'>
                <button
                  type='button'
                  onClick={handleCancelPasswordChange}
                  className='btn btn-ghost btn-sm'
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type='button'
                  onClick={handlePasswordChangeSubmit}
                  className='btn btn-soft btn-primary btn-sm'
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className='loading loading-spinner loading-sm'></span>
                  ) : (
                    <>
                      <FaKey /> Mettre à jour le mot de passe
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      </form>
    </div>
  );
};

export default ProfileSettingsForm;
