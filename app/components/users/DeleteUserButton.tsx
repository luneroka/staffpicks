'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';
import { toast } from 'sonner';

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  userRole: string;
  currentUserRole: string;
  currentUserId?: string;
}

const DeleteUserButton = ({
  userId,
  userName,
  userRole,
  currentUserRole,
  currentUserId,
}: DeleteUserButtonProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Determine if current user can permanently delete this user
  const canDelete = () => {
    if (userId === currentUserId) return false;
    // Only Admin and CompanyAdmin can permanently delete
    if (currentUserRole !== 'admin' && currentUserRole !== 'companyAdmin') {
      return false;
    }
    // Admin can delete anyone
    if (currentUserRole === 'admin') return true;
    // CompanyAdmin cannot delete Admin or CompanyAdmin
    if (currentUserRole === 'companyAdmin') {
      return userRole === 'storeAdmin' || userRole === 'librarian';
    }
    return false;
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      setError('');

      const response = await fetch(`/api/users/${userId}/delete`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success(`Utilisateur "${userName}" supprimé avec succès`);

      // Wait a moment for user to see the success state
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to users list after successful deletion
      router.push('/dashboard/settings/users');
      router.refresh();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
      setIsProcessing(false);
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

  // Don't show button if user cannot delete
  if (!canDelete()) {
    return null;
  }

  return (
    <>
      {/* Delete Button */}
      <button
        type='button'
        onClick={() => setShowModal(true)}
        className='btn btn-error btn-outline btn-sm'
        disabled={isProcessing}
      >
        <FaTrash /> Supprimer définitivement
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
                    Supprimer l&apos;utilisateur
                  </h3>
                  <p className='text-base-content/80'>
                    Êtes-vous sûr de vouloir{' '}
                    <span className='font-semibold text-error'>
                      supprimer définitivement
                    </span>{' '}
                    <span className='font-semibold'>{userName}</span> (
                    {getRoleLabel(userRole)}) ?
                  </p>
                  <p className='text-sm text-base-content/60 mt-2'>
                    Cette action est{' '}
                    <span className='font-semibold'>définitive</span>.
                    L&apos;utilisateur sera marqué comme supprimé et ne pourra
                    plus se connecter. Les données seront conservées mais
                    l&apos;utilisateur sera invisible dans le système.
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

export default DeleteUserButton;
