'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';
import { toast } from 'sonner';

interface DeleteStoreButtonProps {
  storeId: string;
  storeName: string;
  currentUserRole: string;
}

const DeleteStoreButton = ({
  storeId,
  storeName,
  currentUserRole,
}: DeleteStoreButtonProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Only Admin and CompanyAdmin can delete stores
  const canDelete = () => {
    return currentUserRole === 'admin' || currentUserRole === 'companyAdmin';
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      setError('');

      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Show success message
      toast.success(`Magasin "${storeName}" supprimé avec succès`);

      // Wait a moment for user to see the success state
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to stores list after successful deletion
      router.push('/dashboard/settings/stores');
      router.refresh();
    } catch (err) {
      console.error('Error deleting store:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
      setIsProcessing(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setError('');
  };

  // Don't show button if user cannot delete
  if (!canDelete()) {
    return null;
  }

  return (
    <>
      {/* Delete Button */}
      <button
        type='button'
        onClick={openModal}
        className='btn btn-error btn-outline btn-sm'
        disabled={isProcessing}
      >
        <FaTrash /> Supprimer le magasin
      </button>

      {/* Confirmation Modal - Rendered via Portal outside the form */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className='modal modal-open'>
            <div className='modal-box'>
              <div className='flex items-start gap-4 mb-4'>
                <div className='p-3 rounded-full bg-error/20'>
                  <FaExclamationTriangle className='text-3xl text-error' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-bold text-lg mb-2'>
                    Supprimer le magasin
                  </h3>
                  <p className='text-base-content/80'>
                    Êtes-vous sûr de vouloir{' '}
                    <span className='font-semibold text-error'>
                      supprimer définitivement
                    </span>{' '}
                    le magasin{' '}
                    <span className='font-semibold'>{storeName}</span> ?
                  </p>
                  <p className='text-sm text-base-content/60 mt-2'>
                    Cette action est{' '}
                    <span className='font-semibold'>définitive</span>. Le
                    magasin sera supprimé de manière permanente.
                  </p>
                  <div className='alert alert-warning mt-4'>
                    <HiExclamationCircle className='text-xl' />
                    <span className='text-sm'>
                      Vous ne pouvez pas supprimer un magasin avec des
                      utilisateurs assignés. Veuillez d'abord réassigner ou
                      supprimer tous les utilisateurs.
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className='alert alert-error mb-4'>
                  <HiExclamationCircle className='text-xl' />
                  <span>{error}</span>
                </div>
              )}

              <div className='modal-action'>
                <button
                  type='button'
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className='btn btn-ghost'
                  disabled={isProcessing}
                >
                  Annuler
                </button>
                <button
                  type='button'
                  onClick={handleDelete}
                  className='btn btn-error'
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className='loading loading-spinner loading-sm'></span>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <FaTrash /> Confirmer la suppression
                    </>
                  )}
                </button>
              </div>
            </div>
            <div
              className='modal-backdrop'
              onClick={() => {
                if (!isProcessing) {
                  setShowModal(false);
                  setError('');
                }
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default DeleteStoreButton;
