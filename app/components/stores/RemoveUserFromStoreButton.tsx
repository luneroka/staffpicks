'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';

interface RemoveUserFromStoreButtonProps {
  storeId: string;
  storeName: string;
  userId: string;
  userName: string;
  userRole: string;
}

const RemoveUserFromStoreButton = ({
  storeId,
  storeName,
  userId,
  userName,
  userRole,
}: RemoveUserFromStoreButtonProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      setError('');

      const response = await fetch(`/api/stores/${storeId}/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors du retrait de l'utilisateur"
        );
      }

      // Close modal and refresh the page
      setShowModal(false);
      router.refresh();
    } catch (err) {
      console.error('Error removing user from store:', err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du retrait de l'utilisateur"
      );
      setIsRemoving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'companyAdmin':
        return 'Admin Entreprise';
      case 'storeAdmin':
        return 'Admin Magasin';
      case 'librarian':
        return 'Libraire';
      default:
        return role;
    }
  };

  return (
    <>
      {/* Remove Button */}
      <button
        onClick={() => setShowModal(true)}
        className='btn btn-ghost btn-sm text-error'
        disabled={isRemoving}
      >
        <FaTrash /> Retirer
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className='modal modal-open'>
          <div className='modal-box'>
            <div className='flex items-start gap-4 mb-4'>
              <div className='p-3 bg-warning/20 rounded-full'>
                <FaExclamationTriangle className='text-3xl text-warning' />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-lg mb-2'>
                  Retirer l&apos;utilisateur du magasin
                </h3>
                <p className='text-base-content/80'>
                  Êtes-vous sûr de vouloir retirer{' '}
                  <span className='font-semibold'>{userName}</span> (
                  {getRoleLabel(userRole)}) du magasin{' '}
                  <span className='font-semibold'>{storeName}</span> ?
                </p>
                <p className='text-sm text-base-content/60 mt-2'>
                  L&apos;utilisateur ne sera plus associé à ce magasin mais son
                  compte restera actif. Vous pourrez le réassigner plus tard si
                  nécessaire.
                </p>
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
                onClick={() => {
                  setShowModal(false);
                  setError('');
                }}
                className='btn btn-ghost'
                disabled={isRemoving}
              >
                Annuler
              </button>
              <button
                onClick={handleRemove}
                className='btn btn-warning'
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <>
                    <span className='loading loading-spinner loading-sm'></span>
                    Retrait...
                  </>
                ) : (
                  <>
                    <FaTrash /> Confirmer le retrait
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className='modal-backdrop'
            onClick={() => !isRemoving && setShowModal(false)}
          >
            <button>close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default RemoveUserFromStoreButton;
