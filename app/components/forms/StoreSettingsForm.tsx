'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPencilAlt, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import { useFormState } from '@/app/lib/hooks';
import FormAlerts from './FormAlerts';

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
  currentUserRole?: string; // Pass from server component for permission checks
  deleteButton?: React.ReactNode; // Delete button to show at bottom in edit mode
}

const StoreSettingsForm = ({
  storeId,
  initialData,
  onSuccess,
  mode = 'edit',
  currentUserRole = 'storeAdmin',
  deleteButton,
}: StoreSettingsFormProps) => {
  const router = useRouter();
  const { error, success, setError, setSuccess } = useFormState();

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

  useEffect(() => {
    if (initialData) {
      setStoreData(initialData);
      setEditedData(initialData);
    }
  }, [initialData]);

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

  // Function to generate store code from name
  const generateStoreCode = (name: string): string => {
    return name
      .toUpperCase()
      .normalize('NFD') // Normalize to decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^A-Z0-9\s]/g, '') // Keep only uppercase letters, numbers, and spaces
      .trim()
      .replace(/\s+/g, '_'); // Replace spaces with underscores
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
      // Auto-generate code from name when in create mode
      if (name === 'name' && mode === 'create') {
        setEditedData((prev) => ({
          ...prev,
          [name]: value,
          code: generateStoreCode(value),
        }));
      } else {
        setEditedData((prev) => ({ ...prev, [name]: value }));
      }
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

      if (mode === 'create' && data.store._id) {
        // Show success toast for new store
        toast.success(`Magasin "${data.store.name}" créé avec succès`);

        // Redirect to stores list (keep loading state active during redirect)
        router.push('/dashboard/settings/stores/');
        router.refresh();
      } else {
        // Update state for edit mode
        setStoreData(data.store);
        setEditedData(data.store);
        setIsEditing(false);

        // Show success toast for edit mode
        toast.success(`Magasin "${data.store.name}" modifié avec succès`);

        // Refresh server-side data
        router.refresh();

        setIsSaving(false);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error saving store:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
      setIsSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Success and Error Messages */}
      <FormAlerts error={error} success={success} />

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
              {/* Store Name */}
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Nom *</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='name'
                    value={editedData.name}
                    onChange={handleInputChange}
                    className='input input-bordered w-full'
                    placeholder='ex: Fnac Opéra'
                    required
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>{storeData.name}</p>
                )}
              </div>

              {/* Store Code */}
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Code *</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type='text'
                      name='code'
                      value={editedData.code}
                      onChange={handleInputChange}
                      className='input input-bordered w-full'
                      placeholder='ex: FNAC_OPERA'
                      required
                      disabled
                    />
                    {mode === 'create' && (
                      <label className='label'>
                        <span className='label-text-alt text-base-content/60'>
                          Généré automatiquement depuis le nom
                        </span>
                      </label>
                    )}
                  </>
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>{storeData.code}</p>
                )}
              </div>

              {/* Status */}
              <div className='form-control md:col-span-2 w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Statut</span>
                </label>
                {isEditing ? (
                  <select
                    name='status'
                    value={editedData.status}
                    onChange={handleInputChange}
                    className='select select-bordered w-full'
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
              <div className='form-control md:col-span-2 w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Description</span>
                </label>
                {isEditing ? (
                  <textarea
                    name='description'
                    value={editedData.description || ''}
                    onChange={handleInputChange}
                    className='textarea textarea-bordered w-full'
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
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Email</span>
                </label>
                {isEditing ? (
                  <input
                    type='email'
                    name='contactEmail'
                    value={editedData.contactEmail || ''}
                    onChange={handleInputChange}
                    className='input input-bordered w-full'
                    placeholder='contact@magasin.fr'
                  />
                ) : (
                  <p className='p-3 bg-base-300 rounded-lg'>
                    {storeData.contactEmail || 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Téléphone</span>
                </label>
                {isEditing ? (
                  <input
                    type='tel'
                    name='contactPhone'
                    value={editedData.contactPhone || ''}
                    onChange={handleInputChange}
                    className='input input-bordered w-full'
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
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Rue</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='address.street'
                    value={editedData.address?.street || ''}
                    onChange={handleInputChange}
                    className='input input-bordered w-full'
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
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text font-semibold'>Ville</span>
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='address.city'
                      value={editedData.address?.city || ''}
                      onChange={handleInputChange}
                      className='input input-bordered w-full'
                      placeholder='Paris'
                    />
                  ) : (
                    <p className='p-3 bg-base-300 rounded-lg'>
                      {storeData.address?.city || 'Non renseigné'}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text font-semibold'>Région</span>
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='address.state'
                      value={editedData.address?.state || ''}
                      onChange={handleInputChange}
                      className='input input-bordered w-full'
                      placeholder='Île-de-France'
                    />
                  ) : (
                    <p className='p-3 bg-base-300 rounded-lg'>
                      {storeData.address?.state || 'Non renseigné'}
                    </p>
                  )}
                </div>

                {/* Zip Code */}
                <div className='form-control w-full'>
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
                      className='input input-bordered w-full'
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
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-semibold'>Pays</span>
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='address.country'
                    value={editedData.address?.country || ''}
                    onChange={handleInputChange}
                    className='input input-bordered w-full'
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

      {/* Delete Store Section - Only in edit mode */}
      {deleteButton && (
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h3 className='card-title text-error'>Zone de danger</h3>
            <p className='text-sm opacity-70'>
              La suppression d&apos;un point de vente est irréversible. Tous les
              utilisateurs assignés perdront leur affectation.
            </p>
            <div className='card-actions justify-end mt-4'>{deleteButton}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSettingsForm;
