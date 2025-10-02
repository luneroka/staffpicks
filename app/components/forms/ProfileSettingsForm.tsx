'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPencilAlt, FaSave, FaTimes, FaUpload, FaKey } from 'react-icons/fa';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData((prev) => (prev ? { ...prev, [name]: value } : null));
    setError('');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop grande (max 5MB)");
      return;
    }

    setIsUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'user-avatars'); // Specify folder for avatars

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setEditedData((prev) => (prev ? { ...prev, avatarUrl: data.url } : null));
      setSuccess('Avatar uploadé avec succès!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'upload de l'avatar"
      );
    } finally {
      setIsUploadingAvatar(false);
    }
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
      setSuccess('Profil mis à jour avec succès!');

      // Refresh the page to update navbar
      window.location.reload();
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
      {/* Success Message */}
      {success && (
        <div className='alert alert-soft alert-success'>
          <HiCheckCircle className='text-xl' />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='alert alert-soft alert-error'>
          <HiExclamationCircle className='text-xl' />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header with Edit/Save buttons */}
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-semibold'>Informations personnelles</h2>
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
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-semibold'>Prénom *</span>
            </label>
            {isEditing ? (
              <input
                type='text'
                name='firstName'
                value={editedData.firstName}
                onChange={handleInputChange}
                className='input input-bordered'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{userData.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-semibold'>Nom *</span>
            </label>
            {isEditing ? (
              <input
                type='text'
                name='lastName'
                value={editedData.lastName}
                onChange={handleInputChange}
                className='input input-bordered'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{userData.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className='form-control md:col-span-2'>
            <label className='label'>
              <span className='label-text font-semibold'>Email *</span>
            </label>
            {isEditing ? (
              <input
                type='email'
                name='email'
                value={editedData.email}
                onChange={handleInputChange}
                className='input input-bordered'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{userData.email}</p>
            )}
          </div>

          {/* Role (read-only) */}
          <div className='form-control md:col-span-2'>
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

              <div className='form-control'>
                {/* <label className='label'>
                  <span className='label-text font-semibold'>
                    Mot de passe actuel *
                  </span>
                </label> */}
                <input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='input input-bordered'
                  placeholder='Votre mot de passe actuel'
                />
              </div>

              <div className='form-control'>
                {/* <label className='label'>
                  <span className='label-text font-semibold'>
                    Nouveau mot de passe *
                  </span>
                </label> */}
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='input input-bordered'
                  placeholder='Minimum 8 caractères'
                />
              </div>

              <div className='form-control'>
                {/* <label className='label'>
                  <span className='label-text font-semibold'>
                    Confirmer le nouveau mot de passe *
                  </span>
                </label> */}
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
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className='btn btn-ghost btn-sm'
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type='button'
                  onClick={async () => {
                    // Validate password fields
                    if (!currentPassword) {
                      setError('Le mot de passe actuel est requis');
                      return;
                    }

                    if (!newPassword || newPassword.length < 8) {
                      setError(
                        'Le nouveau mot de passe doit contenir au moins 8 caractères'
                      );
                      return;
                    }

                    if (newPassword !== confirmPassword) {
                      setError(
                        'Les nouveaux mots de passe ne correspondent pas'
                      );
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
                          data.error || 'Erreur lors de la sauvegarde'
                        );
                      }

                      setIsChangingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setSuccess('Mot de passe mis à jour avec succès!');

                      // Redirect to login after 1.5 seconds
                      setTimeout(() => {
                        router.push('/login');
                      }, 1500);
                    } catch (err) {
                      console.error('Error updating password:', err);
                      setError(
                        err instanceof Error
                          ? err.message
                          : 'Erreur lors de la mise à jour du mot de passe'
                      );
                    } finally {
                      setIsSaving(false);
                    }
                  }}
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
