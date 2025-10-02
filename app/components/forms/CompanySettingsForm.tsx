'use client';

import React, { useState, useEffect } from 'react';
import { FaPencilAlt, FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import Image from 'next/image';

interface CompanyData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  settings?: {
    allowPublicLists?: boolean;
    requireBookApproval?: boolean;
  };
}

const CompanySettingsForm = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [editedData, setEditedData] = useState<CompanyData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch company data on mount
  useEffect(() => {
    fetchCompanyData();
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/company');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setCompanyData(data);
      setEditedData(data);
    } catch (err) {
      console.error('Error fetching company:', err);
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
    setEditedData(companyData);
    setError('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditedData((prev) =>
        prev
          ? {
              ...prev,
              address: {
                ...prev.address,
                [addressField]: value,
              },
            }
          : null
      );
    } else if (name.startsWith('settings.')) {
      const settingField = name.split('.')[1];
      setEditedData((prev) =>
        prev
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                [settingField]: value === 'true',
              },
            }
          : null
      );
    } else {
      setEditedData((prev) => (prev ? { ...prev, [name]: value } : null));
    }

    setError('');
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const settingField = name.split('.')[1];

    setEditedData((prev) =>
      prev
        ? {
            ...prev,
            settings: {
              ...prev.settings,
              [settingField]: checked,
            },
          }
        : null
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setEditedData((prev) => (prev ? { ...prev, logoUrl: data.url } : null));
      setSuccess('Logo uploadé avec succès!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'upload du logo"
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedData) return;

    // Basic validation
    if (!editedData.name?.trim()) {
      setError("Le nom de l'entreprise est requis");
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedData.name,
          description: editedData.description,
          logoUrl: editedData.logoUrl,
          contactEmail: editedData.contactEmail,
          contactPhone: editedData.contactPhone,
          address: editedData.address,
          settings: editedData.settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setCompanyData(data.company);
      setEditedData(data.company);
      setIsEditing(false);
      setSuccess('Informations mises à jour avec succès!');
    } catch (err) {
      console.error('Error saving company:', err);
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

  if (!companyData || !editedData) {
    return (
      <div className='alert alert-error'>
        <HiExclamationCircle className='text-xl' />
        <span>Impossible de charger les données de l'entreprise</span>
      </div>
    );
  }

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
          <h2 className='text-2xl font-semibold'>Informations générales</h2>
          {!isEditing ? (
            <button
              type='button'
              onClick={handleEdit}
              className='btn btn-primary btn-sm'
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

        {/* Logo Section */}
        <div className='mb-8'>
          <label className='label'>
            <span className='label-text font-semibold'>
              Logo de l'entreprise
            </span>
          </label>
          <div className='flex items-center gap-4'>
            {editedData.logoUrl ? (
              <div className='avatar'>
                <div className='w-24 rounded-lg'>
                  <Image
                    src={editedData.logoUrl}
                    alt='Logo entreprise'
                    width={96}
                    height={96}
                    className='object-cover'
                  />
                </div>
              </div>
            ) : (
              <div className='w-24 h-24 rounded-lg bg-base-300 flex items-center justify-center'>
                <span className='text-4xl'>🏢</span>
              </div>
            )}
            {isEditing && (
              <div>
                <input
                  type='file'
                  id='logo-upload'
                  accept='image/*'
                  onChange={handleLogoUpload}
                  className='hidden'
                  disabled={isUploadingLogo}
                />
                <label
                  htmlFor='logo-upload'
                  className={`btn btn-outline btn-sm ${
                    isUploadingLogo ? 'btn-disabled' : ''
                  }`}
                >
                  {isUploadingLogo ? (
                    <span className='loading loading-spinner loading-sm'></span>
                  ) : (
                    <>
                      <FaUpload /> Changer le logo
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Company Name */}
          <div className='form-control md:col-span-2'>
            <label className='label'>
              <span className='label-text font-semibold'>
                Nom de l'entreprise *
              </span>
            </label>
            {isEditing ? (
              <input
                type='text'
                name='name'
                value={editedData.name}
                onChange={handleInputChange}
                className='input input-bordered'
                required
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>{companyData.name}</p>
            )}
          </div>

          {/* Contact Email */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-semibold'>Email de contact</span>
            </label>
            {isEditing ? (
              <input
                type='email'
                name='contactEmail'
                value={editedData.contactEmail || ''}
                onChange={handleInputChange}
                className='input input-bordered'
                placeholder='contact@example.com'
              />
            ) : (
              <p className='p-3 bg-base-300 rounded-lg'>
                {companyData.contactEmail || 'Non renseigné'}
              </p>
            )}
          </div>

          {/* Contact Phone */}
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
                {companyData.contactPhone || 'Non renseigné'}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className='form-control mt-4'>
          <label className='label'>
            <span className='label-text font-semibold'>Description</span>
          </label>
          {isEditing ? (
            <textarea
              name='description'
              value={editedData.description || ''}
              onChange={handleInputChange}
              className='textarea textarea-bordered h-24'
              placeholder='Décrivez votre entreprise...'
            />
          ) : (
            <p className='p-3 bg-base-300 rounded-lg'>
              {companyData.description || 'Aucune description'}
            </p>
          )}
        </div>

        <div className='divider my-8'></div>

        {/* Address Section */}
        <h3 className='text-xl font-semibold mb-4'>Adresse</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Street */}
          <div className='form-control md:col-span-2'>
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
                {companyData.address?.street || 'Non renseigné'}
              </p>
            )}
          </div>

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
                {companyData.address?.city || 'Non renseigné'}
              </p>
            )}
          </div>

          {/* State/Region */}
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
                {companyData.address?.state || 'Non renseigné'}
              </p>
            )}
          </div>

          {/* Zip Code */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-semibold'>Code postal</span>
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
                {companyData.address?.zipCode || 'Non renseigné'}
              </p>
            )}
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
                {companyData.address?.country || 'Non renseigné'}
              </p>
            )}
          </div>
        </div>

        <div className='divider my-8'></div>

        {/* Settings Section */}
        <h3 className='text-xl font-semibold mb-4'>Paramètres</h3>
        <div className='space-y-4'>
          {/* Allow Public Lists */}
          <div className='form-control'>
            <label className='label cursor-pointer justify-start gap-4'>
              {isEditing ? (
                <input
                  type='checkbox'
                  name='settings.allowPublicLists'
                  checked={editedData.settings?.allowPublicLists || false}
                  onChange={handleCheckboxChange}
                  className='checkbox checkbox-primary'
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded ${
                    companyData.settings?.allowPublicLists
                      ? 'bg-primary'
                      : 'bg-base-300'
                  } flex items-center justify-center`}
                >
                  {companyData.settings?.allowPublicLists && (
                    <HiCheckCircle className='text-primary-content' />
                  )}
                </div>
              )}
              <div>
                <span className='label-text font-semibold'>
                  Autoriser les listes publiques
                </span>
                <p className='text-sm text-base-content/70'>
                  Les listes peuvent être visibles par le public
                </p>
              </div>
            </label>
          </div>

          {/* Require Book Approval */}
          <div className='form-control'>
            <label className='label cursor-pointer justify-start gap-4'>
              {isEditing ? (
                <input
                  type='checkbox'
                  name='settings.requireBookApproval'
                  checked={editedData.settings?.requireBookApproval || false}
                  onChange={handleCheckboxChange}
                  className='checkbox checkbox-primary'
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded ${
                    companyData.settings?.requireBookApproval
                      ? 'bg-primary'
                      : 'bg-base-300'
                  } flex items-center justify-center`}
                >
                  {companyData.settings?.requireBookApproval && (
                    <HiCheckCircle className='text-primary-content' />
                  )}
                </div>
              )}
              <div>
                <span className='label-text font-semibold'>
                  Approbation requise pour les livres
                </span>
                <p className='text-sm text-base-content/70'>
                  Les livres doivent être approuvés avant publication
                </p>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanySettingsForm;
