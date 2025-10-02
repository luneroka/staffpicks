'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatDate,
  getVisibilityConfig,
  getListBookCount,
} from '../../lib/utils';
import { IoTrashBin } from 'react-icons/io5';

interface Items {
  bookId: string;
  position: number;
  addedAt: string;
}

interface CreatedByUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ListData {
  _id: string;
  coverImage: string;
  title?: string;
  visibility?: string;
  items?: Items[];
  createdBy?: CreatedByUser | null;
  updatedAt?: Date | string;
}

interface ListCardProps {
  listData?: ListData;
}

const ListCard = ({ listData }: ListCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!listData) {
    return null;
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to list detail page
    e.stopPropagation();
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/lists/${listData._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete list');
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression de la liste'
      );
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleTrashClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to list detail page
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const visibilityConfig = getVisibilityConfig(listData.visibility);

  return (
    <Link href={`/dashboard/lists/${listData._id}`}>
      <div className='bg-base-200 w-96 shadow-sm rounded-lg p-4 flex justify-between cursor-pointer hover:bg-base-300 hover:scale-102 transition-all duration-200 min-w-lg'>
        <div className='flex gap-8'>
          {/* LIST COVER */}
          <div className='flex w-[121px] h-[170px] relative flex-shrink-0 items-center justify-center'>
            <img
              src={listData.coverImage}
              alt={listData.title || 'Couverture non disponible'}
              className='w-full h-full rounded-md'
              style={{ width: '121px', height: '170px' }}
            />
          </div>

          {/* LIST INFOS */}
          <div className='flex flex-col justify-between'>
            {/* List Title */}
            <p>{listData.title}</p>

            {/* List Visibility */}
            {visibilityConfig && (
              <div
                className={`badge badge-outline ${visibilityConfig.badgeClass}`}
              >
                {visibilityConfig.label}
              </div>
            )}

            {/* List Items */}
            <div className='flex gap-1'>
              <div>{getListBookCount(listData)}</div>
              <p>{(listData.items?.length || 0) < 2 ? 'livre' : 'livres'}</p>
            </div>

            {/* CreatedBy */}
            <div className='flex gap-1'>
              <p className='small-text'>Crée par :</p>
              <div className='small-text'>
                {listData.createdBy
                  ? `${listData.createdBy.firstName} ${listData.createdBy.lastName}`
                  : 'Inconnu'}
              </div>
            </div>

            {/* Last Updated At */}
            <div className='flex gap-1 text-base-content/60 italic'>
              <p className='small-text'>Dernière modification :</p>
              <div className='small-text'>{formatDate(listData.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Trash Icon */}
        <button
          onClick={handleTrashClick}
          disabled={isDeleting}
          className='self-start btn btn-soft hover:btn-error'
        >
          <IoTrashBin />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <dialog className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='font-bold text-lg mb-4'>Confirmer la suppression</h3>
            <p className='py-4'>
              Êtes-vous sûr de vouloir supprimer la liste "
              <span className='font-semibold'>{listData.title}</span>" ? Cette
              action est irréversible.
            </p>
            <div className='modal-action'>
              <button
                className='btn btn-ghost'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                className='btn btn-error'
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className='loading loading-spinner loading-sm'></span>
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
          <form method='dialog' className='modal-backdrop'>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(false);
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </Link>
  );
};

export default ListCard;
