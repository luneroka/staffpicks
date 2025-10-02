'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPencilAlt, FaSave, FaTimes, FaStore } from 'react-icons/fa';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

interface StoreData {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
}

interface StoreSettingsFormProps {
  storeId?: string;
  initialData?: StoreData;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
}

const StoreSettingsForm = ({
  storeId,
  initialData,
  onSuccess,
  mode = 'edit',
}: StoreSettingsFormProps) => {
  const router = useRouter();
  const [storeData, setStoreData] = useState<StoreData>(
    initialData || {
      code: '',
      name: '',
      description: '',
      status: 'active',
      contactEmail: '',
      contactPhone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'France',
      },
      operatingHours: {},
    }
  );
  const [editedData, setEditedData] = useState<StoreData>(storeData);
  const [isEditing, setIsEditing] = useState(mode === 'create');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setStoreData(initialData);
      setEditedData(initialData);
    }
  }, [initialData]);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setEditedData({
        code: '',
        name: '',
        description: '',
        status: 'active',
        contactEmail: '',
        contactPhone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'France',
        },
        operatingHours: {},
      });
    } else {
      setIsEditing(false);
      setEditedData(storeData);
    }
    setError('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditedData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setEditedData((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!editedData.name?.trim()) {
      setError('Le nom du magasin est requis');
      return;
    }

    if (!editedData.code?.trim()) {
      setError('Le code du magasin est requis');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = mode === 'create' ? '/api/stores' : `/api/stores/${storeId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setStoreData(data.store);
      setEditedData(data.store);
      setIsEditing(false);
      setSuccess(
        mode === 'create'
          ? 'Magasin créé avec succès!'
          : 'Magasin mis à jour avec succès!'
      );

      if (onSuccess) {
        onSuccess();
      }

      // Redirect to the store detail page after creation
      if (mode === 'create' && data.store._id) {
        setTimeout(() => {
          router.push(`/dashboard/settings/stores/${data.store._id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving store:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setIsSaving(false);
    }
  };

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
        {/* Basic Information */}
        <div className='card bg-base-200 shadow-sm mb-6'>
          <div className='card-body'>
            <div className='flex justify-between'>
              <h3 className='card-title text-lg mb-4'>
                Informations générales
              </h3>
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
                        <FaSave /> {mode === 'create' ? 'Créer' : 'Enregistrer'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Store Code */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-semibold'>Code *</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='code'
                    value={editedData.code}
                    onChange={handleInputChange}
                    className='input input-bordered'
                    placeholder='ex: PARIS_OPERA'
                    required
                    disabled={mode === 'edit'}
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>{storeData.code}</p>
                )}
                {isEditing && (
                  <label className='label'>
                    <span className='label-text-alt text-base-content/60'>
                      Code unique (majuscules, tirets bas autorisés)
                    </span>
                  </label>
                )}
              </div>

              {/* Store Name */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-semibold'>Nom *</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='name'
                    value={editedData.name}
                    onChange={handleInputChange}
                    className='input input-bordered'
                    placeholder='ex: Fnac Opéra'
                    required
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>{storeData.name}</p>
                )}
              </div>

              {/* Status */}
              <div className='form-control md:col-span-2'>
                <label className='label'>
                  <span className='label-text font-semibold'>Statut</span>
                </label>
                {isEditing ? (
                  <select
                    name='status'
                    value={editedData.status}
                    onChange={handleInputChange}
                    className='select select-bordered'
                  >
                    <option value='active'>Actif</option>
                    <option value='inactive'>Inactif</option>
                    <option value='maintenance'>Maintenance</option>
                  </select>
                ) : (
                  <div>
                    <span
                      className={`badge ${
                        storeData.status === 'active'
                          ? 'badge-success'
                          : storeData.status === 'inactive'
                          ? 'badge-error'
                          : 'badge-warning'
                      }`}
                    >
                      {storeData.status === 'active' && 'Actif'}
                      {storeData.status === 'inactive' && 'Inactif'}
                      {storeData.status === 'maintenance' && 'Maintenance'}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className='form-control md:col-span-2'>
                <label className='label'>
                  <span className='label-text font-semibold'>Description</span>
                </label>
                {isEditing ? (
                  <textarea
                    name='description'
                    value={editedData.description || ''}
                    onChange={handleInputChange}
                    className='textarea textarea-bordered'
                    rows={3}
                    placeholder='Description du magasin...'
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {storeData.description || 'Aucune description'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className='card bg-base-200 shadow-sm mb-6'>
          <div className='card-body'>
            <h3 className='card-title text-lg mb-4'>Contact</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Email */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-semibold'>Email</span>
                </label>
                {isEditing ? (
                  <input
                    type='email'
                    name='contactEmail'
                    value={editedData.contactEmail || ''}
                    onChange={handleInputChange}
                    className='input input-bordered'
                    placeholder='contact@magasin.fr'
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {storeData.contactEmail || 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-semibold'>Téléphone</span>
                </label>
                {isEditing ? (
                  <input
                    type='tel'
                    name='contactPhone'
                    value={editedData.contactPhone || ''}
                    onChange={handleInputChange}
                    className='input input-bordered'
                    placeholder='+33 1 23 45 67 89'
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {storeData.contactPhone || 'Non renseigné'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className='card bg-base-200 shadow-sm'>
          <div className='card-body'>
            <h3 className='card-title text-lg mb-4'>Adresse</h3>

            <div className='grid grid-cols-1 gap-4'>
              {/* Street */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-semibold'>Rue</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='address.street'
                    value={editedData.address?.street || ''}
                    onChange={handleInputChange}
                    className='input input-bordered'
                    placeholder='123 Rue de la Paix'
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {storeData.address?.street || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* City */}
                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text font-semibold'>Ville</span>
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='address.city'
                      value={editedData.address?.city || ''}
                      onChange={handleInputChange}
                      className='input input-bordered'
                      placeholder='Paris'
                    />
                  ) : (
                    <p className='p-3 bg-base-300 rounded-lg'>
                      {storeData.address?.city || 'Non renseigné'}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text font-semibold'>Région</span>
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='address.state'
                      value={editedData.address?.state || ''}
                      onChange={handleInputChange}
                      className='input input-bordered'
                      placeholder='Île-de-France'
                    />
                  ) : (
                    <p className='p-3 bg-base-300 rounded-lg'>
                      {storeData.address?.state || 'Non renseigné'}
                    </p>
                  )}
                </div>

                {/* Zip Code */}
                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text font-semibold'>
                      Code postal
                    </span>
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='address.zipCode'
                      value={editedData.address?.zipCode || ''}
                      onChange={handleInputChange}
                      className='input input-bordered'
                      placeholder='75001'
                    />
                  ) : (
                    <p className='p-3 bg-base-300 rounded-lg'>
                      {storeData.address?.zipCode || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-semibold'>Pays</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='address.country'
                    value={editedData.address?.country || ''}
                    onChange={handleInputChange}
                    className='input input-bordered'
                    placeholder='France'
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {storeData.address?.country || 'Non renseigné'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StoreSettingsForm;
