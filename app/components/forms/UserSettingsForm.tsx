'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPencilAlt, FaSave, FaTimes, FaUser, FaUpload } from 'react-icons/fa';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import Image from 'next/image';

interface UserData {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  storeId?: string;
  storeName?: string;
  sections?: string[];
  avatarUrl?: string;
}

interface UserSettingsFormProps {
  userId?: string;
  initialData?: UserData;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
  currentUserRole?: string; // Pass from server component
  currentUserStoreId?: string; // For StoreAdmin to limit store selection
  deleteButtons?: React.ReactNode; // Delete buttons to show at bottom in edit mode
}

const UserSettingsForm = ({
  userId,
  initialData,
  onSuccess,
  mode = 'edit',
  currentUserRole = 'librarian',
  currentUserStoreId,
  deleteButtons,
}: UserSettingsFormProps) => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      role: 'librarian',
      sections: [],
    }
  );
  const [editedData, setEditedData] = useState<UserData>(userData);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(mode === 'create');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [currentStoreName, setCurrentStoreName] = useState<string>('');
  const [newSection, setNewSection] = useState('');

  // Remove session fetching - we get it from props now

  useEffect(() => {
    if (initialData) {
      setUserData(initialData);
      setEditedData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Fetch current store name for StoreAdmin
    const fetchCurrentStore = async () => {
      if (currentUserRole === 'storeAdmin' && currentUserStoreId) {
        try {
          const response = await fetch(`/api/stores/${currentUserStoreId}`);
          const data = await response.json();
          if (response.ok) {
            setCurrentStoreName(data.name);
          }
        } catch (err) {
          console.error('Error fetching current store:', err);
        }
      }
    };

    fetchCurrentStore();
  }, [currentUserRole, currentUserStoreId]);

  useEffect(() => {
    // Auto-set storeId for StoreAdmin creating users
    if (
      mode === 'create' &&
      currentUserRole === 'storeAdmin' &&
      currentUserStoreId &&
      !editedData.storeId
    ) {
      setEditedData((prev) => ({ ...prev, storeId: currentUserStoreId }));
    }
  }, [mode, currentUserRole, currentUserStoreId, editedData.storeId]);

  useEffect(() => {
    // Fetch stores when role requires store assignment (but not for StoreAdmin creating users)
    if (
      isEditing &&
      (editedData.role === 'storeAdmin' || editedData.role === 'librarian') &&
      currentUserRole !== 'storeAdmin' // StoreAdmin doesn't need the store list
    ) {
      fetchStores();
    }
  }, [isEditing, editedData.role, currentUserRole]);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const response = await fetch('/api/stores');
      const data = await response.json();
      if (response.ok) {
        setStores(data);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setEditedData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'librarian',
        sections: [],
      });
      setPassword('');
      setConfirmPassword('');
    } else {
      setIsEditing(false);
      setEditedData(userData);
    }
    setError('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddSection = () => {
    if (
      newSection.trim() &&
      !editedData.sections?.includes(newSection.trim())
    ) {
      setEditedData((prev) => ({
        ...prev,
        sections: [...(prev.sections || []), newSection.trim()],
      }));
      setNewSection('');
    }
  };

  const handleRemoveSection = (section: string) => {
    setEditedData((prev) => ({
      ...prev,
      sections: prev.sections?.filter((s) => s !== section) || [],
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop grande (max 5MB)");
      return;
    }

    setIsUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'user-avatars');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setEditedData((prev) => ({ ...prev, avatarUrl: data.url }));
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

    // Validation
    if (!editedData.firstName?.trim() || !editedData.lastName?.trim()) {
      setError('Le prénom et le nom sont requis');
      return;
    }

    if (!editedData.email?.trim()) {
      setError("L'email est requis");
      return;
    }

    if (mode === 'create') {
      if (!password || password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }

    if (
      (editedData.role === 'storeAdmin' || editedData.role === 'librarian') &&
      !editedData.storeId
    ) {
      setError('Un magasin doit être assigné pour ce rôle');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = mode === 'create' ? '/api/users' : `/api/users/${userId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const body: any = {
        firstName: editedData.firstName,
        lastName: editedData.lastName,
        email: editedData.email,
        role: editedData.role,
        storeId: editedData.storeId || null,
        sections: editedData.sections || [],
        avatarUrl: editedData.avatarUrl,
      };

      if (mode === 'create') {
        body.password = password;
      }

      const response = await fetch(url, {
        method,
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
      setSuccess(
        mode === 'create'
          ? 'Utilisateur créé avec succès!'
          : 'Utilisateur mis à jour avec succès!'
      );

      if (onSuccess) {
        onSuccess();
      }

      // Redirect to the user detail page after creation
      if (mode === 'create' && data.user._id) {
        setTimeout(() => {
          router.push(`/dashboard/settings/users/${data.user._id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    const roles = [];

    if (currentUserRole === 'admin' || currentUserRole === 'companyAdmin') {
      // Admin and CompanyAdmin can assign: CompanyAdmin, StoreAdmin, Librarian
      roles.push(
        { value: 'companyAdmin', label: 'Admin Entreprise' },
        { value: 'storeAdmin', label: 'Admin Magasin' },
        { value: 'librarian', label: 'Libraire' }
      );
    } else if (currentUserRole === 'storeAdmin') {
      // StoreAdmin can only assign: Librarian
      roles.push({ value: 'librarian', label: 'Libraire' });
    }

    return roles;
  };

  const roleRequiresStore =
    editedData.role === 'storeAdmin' || editedData.role === 'librarian';

  return (
    <div className='space-y-6'>
      {/* Success Message */}
      {success && (
        <div className='alert alert-success'>
          <HiCheckCircle className='text-xl' />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='alert alert-error'>
          <HiExclamationCircle className='text-xl' />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header with Edit/Save buttons */}
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-semibold flex items-center gap-2'>
            <FaUser />
            {mode === 'create'
              ? 'Nouvel utilisateur'
              : 'Informations utilisateur'}
          </h2>
          {!isEditing && mode === 'edit' ? (
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
        <div className='card bg-base-200 shadow-sm mb-6'>
          <div className='card-body'>
            <h3 className='card-title text-lg mb-4'>Photo de profil</h3>
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
                  <FaUser className='text-4xl text-base-content/30' />
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
        </div>

        {/* Basic Information */}
        <div className='card bg-base-200 shadow-sm mb-6'>
          <div className='card-body'>
            <h3 className='card-title text-lg mb-4'>Informations générales</h3>

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
                    placeholder='Jean'
                    required
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {userData.firstName}
                  </p>
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
                    placeholder='Dupont'
                    required
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {userData.lastName}
                  </p>
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
                    placeholder='jean.dupont@example.com'
                    required
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>{userData.email}</p>
                )}
              </div>

              {/* Role */}
              <div className='form-control md:col-span-2 w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Rôle *</span>
                </label>
                {isEditing ? (
                  <>
                    <select
                      name='role'
                      value={editedData.role}
                      onChange={handleInputChange}
                      className='select select-bordered w-full'
                      required
                    >
                      <option value=''>Sélectionner un rôle</option>
                      {getAvailableRoles().map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {currentUserRole === 'storeAdmin' && (
                      <label className='label'>
                        <span className='label-text-alt text-info'>
                          💡 En tant qu&apos;Admin Magasin, vous ne pouvez créer
                          que des Libraires pour votre magasin
                        </span>
                      </label>
                    )}
                  </>
                ) : (
                  <div>
                    <span
                      className={`badge ${
                        userData.role === 'admin'
                          ? 'badge-error'
                          : userData.role === 'companyAdmin'
                          ? 'badge-warning'
                          : userData.role === 'storeAdmin'
                          ? 'badge-info'
                          : 'badge-ghost'
                      }`}
                    >
                      {userData.role === 'admin' && 'Admin'}
                      {userData.role === 'companyAdmin' && 'Admin Entreprise'}
                      {userData.role === 'storeAdmin' && 'Admin Magasin'}
                      {userData.role === 'librarian' && 'Libraire'}
                    </span>
                  </div>
                )}
              </div>

              {/* Store Assignment */}
              {roleRequiresStore && (
                <div className='form-control md:col-span-2 w-full'>
                  <label className='label'>
                    <span className='label-text font-semibold'>Magasin *</span>
                  </label>
                  {isEditing ? (
                    <>
                      {currentUserRole === 'storeAdmin' ? (
                        // StoreAdmin: show their store as locked/disabled
                        <>
                          <input
                            type='text'
                            value={currentStoreName || 'Votre magasin'}
                            className='input input-bordered w-full'
                            disabled
                          />
                          <label className='label'>
                            <span className='label-text-alt text-info'>
                              💡 Les utilisateurs que vous créez seront
                              automatiquement assignés à votre magasin
                            </span>
                          </label>
                        </>
                      ) : loadingStores ? (
                        <span className='loading loading-spinner'></span>
                      ) : (
                        <select
                          name='storeId'
                          value={editedData.storeId || ''}
                          onChange={handleInputChange}
                          className='select select-bordered w-full'
                          required
                        >
                          <option value=''>Sélectionner un magasin</option>
                          {stores.map((store) => (
                            <option key={store._id} value={store._id}>
                              {store.name} ({store.code})
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  ) : (
                    <p className='p-3 bg-base-300 rounded-lg'>
                      {userData.storeName || 'Aucun magasin assigné'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password (Create mode only) */}
        {mode === 'create' && (
          <div className='card bg-base-200 shadow-sm mb-6'>
            <div className='card-body'>
              <h3 className='card-title text-lg mb-4'>Mot de passe</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text font-semibold'>
                      Mot de passe *
                    </span>
                  </label>
                  <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='input input-bordered w-full'
                    placeholder='Minimum 8 caractères'
                    required
                    minLength={8}
                  />
                </div>

                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text font-semibold'>
                      Confirmer le mot de passe *
                    </span>
                  </label>
                  <input
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className='input input-bordered w-full'
                    placeholder='Confirmer le mot de passe'
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sections (For Librarians) */}
        {editedData.role === 'librarian' && (
          <div className='card bg-base-200 shadow-sm mb-6'>
            <div className='card-body w-1/2'>
              <h3 className='card-title text-lg mb-4'>Rayons assignés</h3>

              {isEditing ? (
                <>
                  <div className='flex gap-2 mb-4'>
                    <input
                      type='text'
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSection();
                        }
                      }}
                      className='input input-bordered flex-1'
                      placeholder='Nom du rayon (ex: Fiction, Jeunesse...)'
                    />
                    <button
                      type='button'
                      onClick={handleAddSection}
                      className='btn btn-primary'
                    >
                      Ajouter
                    </button>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {(editedData.sections || []).map((section) => (
                      <div key={section} className='badge badge-lg gap-2'>
                        {section}
                        <button
                          type='button'
                          onClick={() => handleRemoveSection(section)}
                          className='btn btn-ghost btn-xs btn-circle'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {(editedData.sections || []).length === 0 && (
                      <p className='text-base-content/60'>
                        Aucun rayon assigné
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {(userData.sections || []).map((section) => (
                    <span key={section} className='badge badge-lg'>
                      {section}
                    </span>
                  ))}
                  {(userData.sections || []).length === 0 && (
                    <p className='text-base-content/60'>Aucun rayon assigné</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Buttons - Only show in edit mode at the bottom */}
        {isEditing && mode === 'edit' && deleteButtons && (
          <div className='card bg-base-200 shadow-sm mb-6'>
            <div className='card-body'>
              <h3 className='card-title text-lg mb-4 text-error'>
                Zone de danger
              </h3>
              <p className='text-base-content/60 mb-4'>
                Actions irréversibles ou critiques pour ce compte utilisateur.
              </p>
              {deleteButtons}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default UserSettingsForm;
