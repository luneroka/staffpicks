'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDate, getVisibilityConfig } from '../../lib/utils';
import Book from '../books/Book';
import {
  HiExclamationCircle,
  HiPencilAlt,
  HiTrash,
  HiBookOpen,
} from 'react-icons/hi';

interface ListItem {
  bookId: string;
  isbn: string;
  title: string;
  authors: string[];
  cover?: string;
  genre?: string;
  tone?: string;
  ageGroup?: string;
  position: number;
  addedAt?: Date;
}

interface ListDetailsProps {
  list: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    coverImage?: string;
    visibility: string;
    publishAt?: Date;
    unpublishAt?: Date;
    items: ListItem[];
    owner?: {
      name: string;
      email: string;
    };
    createdBy?: {
      name: string;
      email: string;
    };
    storeId?: string;
    storeName?: string;
    assignedTo?: string[];
    sections?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  };
  userRole?: string;
}

const ListDetails = ({ list, userRole }: ListDetailsProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete list');
      }

      // Redirect to lists page after successful deletion
      router.push('/dashboard/lists');
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

  const visibilityConfig = getVisibilityConfig(list.visibility);

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      {/* Header Card */}
      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* List Cover */}
            <div className='flex-shrink-0'>
              <div className='shadow-lg'>
                <img
                  src={
                    list.coverImage ||
                    'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075480/rentr%C3%A9e_litt%C3%A9raire_ac1clu.png'
                  }
                  alt={list.title}
                  className='w-48 h-auto rounded-lg '
                />
              </div>
            </div>

            {/* List Information */}
            <div className='flex-1 space-y-4'>
              <div>
                <h1 className='card-title text-2xl mb-2'>{list.title}</h1>
                {visibilityConfig && (
                  <div
                    className={`badge badge-outline badge-lg ${visibilityConfig.badgeClass}`}
                  >
                    {visibilityConfig.label}
                  </div>
                )}
              </div>

              {list.description && (
                <p className='text-base-content/80 leading-relaxed'>
                  {list.description}
                </p>
              )}

              {/* Stats */}
              <div className='stats shadow bg-base-300'>
                <div className='stat'>
                  <div className='stat-value text-primary'>
                    {list.items.length}
                  </div>
                  <div className='stat-desc'>
                    {list.items.length < 2 ? 'livre' : 'livres'} dans cette
                    liste
                  </div>
                </div>

                <div className='flex flex-col stat justify-between'>
                  <div>
                    <div className='stat-title'>Créée par</div>
                    <div className='stat-value text-sm'>
                      {list.createdBy?.name || 'Inconnu'}
                    </div>
                  </div>
                  {list.visibility === 'public' && (
                    <div className='stat-desc'>
                      Publiée le {formatDate(list.publishAt || list.createdAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex card-actions justify-start gap-6'>
                {/* Hide Edit and Delete buttons for CompanyAdmin */}
                {userRole !== 'companyAdmin' && (
                  <>
                    <Link
                      href={`/dashboard/lists/${list.id}/edit`}
                      className='btn btn-soft btn-primary'
                    >
                      <HiPencilAlt className='h-4 w-4' />
                      Modifier
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className='btn btn-soft btn-error'
                      disabled={isDeleting}
                    >
                      <HiTrash className='h-4 w-4' />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <dialog className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='font-bold text-lg mb-4'>Confirmer la suppression</h3>
            <p className='py-4'>
              Êtes-vous sûr de vouloir supprimer la liste "
              <span className='font-semibold'>{list.title}</span>" ? Cette
              action est irréversible.
            </p>
            <div className='modal-action'>
              <button
                className='btn btn-ghost'
                onClick={() => setShowDeleteModal(false)}
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
            <button onClick={() => setShowDeleteModal(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* Books Section */}
      {list.items.length > 0 && (
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title text-xl mb-4'>
              <HiBookOpen className='h-6 w-6' />
              Livres de la liste
            </h2>
            <div className='flex gap-4'>
              {list.items.map((item) => (
                <Book
                  key={item.bookId}
                  id={item.bookId}
                  coverUrl={item.cover}
                  title={item.title}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {list.items.length === 0 && (
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body text-center'>
            <div className='py-12'>
              <HiBookOpen className='h-16 w-16 mx-auto text-base-content/40 mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Liste vide</h3>
              <p className='text-base-content/60 mb-4'>
                Cette liste ne contient encore aucun livre.
              </p>
              <Link
                href={`/dashboard/lists/${list.id}/edit`}
                className='btn btn-primary'
              >
                Ajouter des livres
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListDetails;
