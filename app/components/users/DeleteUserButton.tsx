'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserSlash, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  userRole: string;
  currentUserRole: string;
  currentUserId?: string;
}

type ActionType = 'deactivate' | 'delete';

const DeleteUserButton = ({
  userId,
  userName,
  userRole,
  currentUserRole,
  currentUserId,
}: DeleteUserButtonProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<ActionType>('deactivate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Determine if current user can deactivate this user
  const canDeactivate = () => {
    if (userId === currentUserId) return false;
    if (currentUserRole === 'librarian') return false;
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'companyAdmin') {
      return userRole === 'storeAdmin' || userRole === 'librarian';
    }
    if (currentUserRole === 'storeAdmin') {
      return userRole === 'librarian';
    }
    return false;
  };

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

  const handleAction = async () => {
    try {
      setIsProcessing(true);
      setError('');

      let response;
      if (actionType === 'deactivate') {
        response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/users/${userId}/delete`, {
          method: 'POST',
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'opération");
      }

      // Redirect to users list after successful action
      router.push('/dashboard/settings/users');
      router.refresh();
    } catch (err) {
      console.error('Error processing user action:', err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'opération"
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

  const openModal = (type: ActionType) => {
    setActionType(type);
    setShowModal(true);
    setError('');
  };

  // Don't show any buttons if user cannot do anything
  if (!canDeactivate() && !canDelete()) {
    return null;
  }

  return (
    <>
      {/* Action Buttons */}
      <div className='flex gap-2'>
        {canDeactivate() && (
          <button
            onClick={() => openModal('deactivate')}
            className='btn btn-warning btn-outline btn-sm'
            disabled={isProcessing}
          >
            <FaUserSlash /> Désactiver
          </button>
        )}
        {canDelete() && (
          <button
            onClick={() => openModal('delete')}
            className='btn btn-error btn-outline btn-sm'
            disabled={isProcessing}
          >
            <FaTrash /> Supprimer
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className='modal modal-open'>
          <div className='modal-box'>
            <div className='flex items-start gap-4 mb-4'>
              <div
                className={`p-3 rounded-full ${
                  actionType === 'delete' ? 'bg-error/20' : 'bg-warning/20'
                }`}
              >
                <FaExclamationTriangle
                  className={`text-3xl ${
                    actionType === 'delete' ? 'text-error' : 'text-warning'
                  }`}
                />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-lg mb-2'>
                  {actionType === 'delete'
                    ? "Supprimer l'utilisateur"
                    : "Désactiver l'utilisateur"}
                </h3>
                <p className='text-base-content/80'>
                  {actionType === 'delete' ? (
                    <>
                      Êtes-vous sûr de vouloir{' '}
                      <span className='font-semibold text-error'>
                        supprimer définitivement
                      </span>{' '}
                      <span className='font-semibold'>{userName}</span> (
                      {getRoleLabel(userRole)}) ?
                    </>
                  ) : (
                    <>
                      Êtes-vous sûr de vouloir désactiver{' '}
                      <span className='font-semibold'>{userName}</span> (
                      {getRoleLabel(userRole)}) ?
                    </>
                  )}
                </p>
                <p className='text-sm text-base-content/60 mt-2'>
                  {actionType === 'delete' ? (
                    <>
                      Cette action est{' '}
                      <span className='font-semibold'>définitive</span>.
                      L&apos;utilisateur sera marqué comme supprimé et ne pourra
                      plus se connecter. Les données seront conservées mais
                      l&apos;utilisateur sera invisible dans le système.
                    </>
                  ) : (
                    <>
                      Le compte sera désactivé et l&apos;utilisateur ne pourra
                      plus se connecter. Vous pourrez réactiver ce compte
                      ultérieurement si nécessaire.
                    </>
                  )}
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
                disabled={isProcessing}
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                className={`btn ${
                  actionType === 'delete' ? 'btn-error' : 'btn-warning'
                }`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className='loading loading-spinner loading-sm'></span>
                    {actionType === 'delete'
                      ? 'Suppression...'
                      : 'Désactivation...'}
                  </>
                ) : (
                  <>
                    {actionType === 'delete' ? (
                      <>
                        <FaTrash /> Confirmer la suppression
                      </>
                    ) : (
                      <>
                        <FaUserSlash /> Confirmer la désactivation
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className='modal-backdrop'
            onClick={() => !isProcessing && setShowModal(false)}
          >
            <button>close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteUserButton;
