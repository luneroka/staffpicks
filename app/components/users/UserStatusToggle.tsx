'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserStatusToggleProps {
  userId: string;
  currentStatus: string;
  userName: string;
}

const UserStatusToggle = ({
  userId,
  currentStatus,
  userName,
}: UserStatusToggleProps) => {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'activate' | 'deactivate' | 'suspend' | null
  >(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Actif',
          badgeClass: 'badge-success',
          icon: '✓',
        };
      case 'inactive':
        return {
          label: 'Inactif',
          badgeClass: 'badge-warning',
          icon: '⏸',
        };
      case 'suspended':
        return {
          label: 'Suspendu',
          badgeClass: 'badge-error',
          icon: '⛔',
        };
      default:
        return {
          label: 'Inconnu',
          badgeClass: 'badge-ghost',
          icon: '?',
        };
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'activate':
        return 'Activer';
      case 'deactivate':
        return 'Désactiver';
      case 'suspend':
        return 'Suspendre';
      default:
        return '';
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'activate':
        return "L'utilisateur pourra se connecter et accéder à son compte.";
      case 'deactivate':
        return "L'utilisateur ne pourra plus se connecter temporairement. Ses livres et listes resteront visibles.";
      case 'suspend':
        return "L'utilisateur ne pourra plus se connecter. Ses livres et listes resteront visibles.";
      default:
        return '';
    }
  };

  const handleActionClick = (action: 'activate' | 'deactivate' | 'suspend') => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;

    setIsChanging(true);

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: pendingAction }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de statut');
      }

      toast.success(
        `Statut de ${userName} changé à "${
          getStatusConfig(data.user.status).label
        }" avec succès`
      );

      setShowConfirmModal(false);
      setPendingAction(null);

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error('Error changing user status:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors du changement de statut'
      );
    } finally {
      setIsChanging(false);
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Current Status Display */}
        <div className='flex items-center gap-3'>
          <span className='font-semibold'>Statut actuel :</span>
          <span className={`badge ${statusConfig.badgeClass} badge-lg`}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3'>
          {currentStatus !== 'active' && (
            <button
              type='button'
              className='btn btn-success btn-sm'
              onClick={() => handleActionClick('activate')}
              disabled={isChanging}
            >
              ✓ Activer
            </button>
          )}
          {currentStatus !== 'inactive' && (
            <button
              type='button'
              className='btn btn-warning btn-sm'
              onClick={() => handleActionClick('deactivate')}
              disabled={isChanging}
            >
              ⏸ Désactiver
            </button>
          )}
          {currentStatus !== 'suspended' && (
            <button
              type='button'
              className='btn btn-error btn-sm'
              onClick={() => handleActionClick('suspend')}
              disabled={isChanging}
            >
              ⛔ Suspendre
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <dialog className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='font-bold text-lg mb-4'>
              Confirmer le changement de statut
            </h3>
            <p className='py-2'>
              Êtes-vous sûr de vouloir{' '}
              <span className='font-semibold'>
                {getActionLabel(pendingAction).toLowerCase()}
              </span>{' '}
              le compte de <span className='font-semibold'>{userName}</span> ?
            </p>
            <p className='py-2 text-sm text-base-content/70'>
              {getActionDescription(pendingAction)}
            </p>
            <div className='modal-action'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                disabled={isChanging}
              >
                Annuler
              </button>
              <button
                type='button'
                className={`btn ${
                  pendingAction === 'activate'
                    ? 'btn-success'
                    : pendingAction === 'deactivate'
                    ? 'btn-warning'
                    : 'btn-error'
                }`}
                onClick={handleConfirm}
                disabled={isChanging}
              >
                {isChanging ? (
                  <>
                    <span className='loading loading-spinner loading-sm'></span>
                    Changement...
                  </>
                ) : (
                  getActionLabel(pendingAction)
                )}
              </button>
            </div>
          </div>
          <div
            className='modal-backdrop'
            onClick={() => {
              setShowConfirmModal(false);
              setPendingAction(null);
            }}
          />
        </dialog>
      )}
    </>
  );
};

export default UserStatusToggle;
