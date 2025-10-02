'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  HiShoppingBag,
  HiPencilAlt,
  HiTrash,
  HiDocumentText,
  HiStar,
} from 'react-icons/hi';

interface BookDetailsProps {
  book: {
    id: string;
    isbn: string;
    title: string;
    authors: string[];
    cover?: string;
    description?: string;
    publisher?: string;
    pageCount?: number;
    publishDate?: Date;
    genre?: string;
    tone?: string;
    ageGroup?: string;
    purchaseLink?: string;
    recommendation?: string;
    owner?: {
      name: string;
      email: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
  };
}

const BookDetails = ({ book }: BookDetailsProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete book');
      }

      // Redirect to books list after successful deletion
      router.push('/dashboard/books');
      router.refresh();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression du livre'
      );
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      {/* Header Card */}
      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <div className='flex flex-col lg:flex-row gap-8'>
            {/* Book Cover */}
            <div className='flex-shrink-0 mx-auto lg:mx-0'>
              <div className='relative'>
                <img
                  src={book.cover || '/placeholder-book-cover.jpg'}
                  alt={book.title}
                  className='w-48 h-auto rounded-lg shadow-2xl'
                />
              </div>
            </div>

            {/* Book Information */}
            <div className='flex-1 space-y-6'>
              <div>
                <h1 className='card-title text-2xl font-bold mb-3'>
                  {book.title}
                </h1>
                <p className='text-xl text-base-content/80 mb-4'>
                  par {book.authors.join(', ')}
                </p>

                {/* Genre Badges */}
                <div className='flex flex-wrap gap-2 mb-4'>
                  {book.genre && (
                    <div className='badge badge-primary badge-lg'>
                      {book.genre}
                    </div>
                  )}
                  {book.tone && (
                    <div className='badge badge-secondary badge-lg'>
                      {book.tone}
                    </div>
                  )}
                  {book.ageGroup && (
                    <div className='badge badge-accent badge-lg'>
                      {book.ageGroup}
                    </div>
                  )}
                </div>
              </div>

              {/* Book Stats */}
              <div className='stats shadow bg-base-300'>
                {book.pageCount && (
                  <div className='stat'>
                    <div className='stat-title'>Pages</div>
                    <div className='stat-value text-xl text-primary'>
                      {book.pageCount}
                    </div>
                  </div>
                )}

                {book.publisher && (
                  <div className='stat'>
                    <div className='stat-title'>Éditeur</div>
                    <div className='stat-value text-xl'>{book.publisher}</div>
                  </div>
                )}

                <div className='stat'>
                  <div className='stat-title'>ISBN</div>
                  <div className='stat-value text-sm font-mono'>
                    {book.isbn}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='card-actions justify-start flex-wrap gap-6'>
                {book.purchaseLink && (
                  <a
                    href={book.purchaseLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-soft btn-secondary'
                  >
                    <HiShoppingBag className='h-5 w-5' />
                    Lien boutique
                  </a>
                )}
                <Link
                  href={`/dashboard/books/${book.id}/edit`}
                  className='btn btn-soft btn-primary'
                >
                  <HiPencilAlt className='h-5 w-5' />
                  Modifier
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className='btn btn-soft btn-error'
                  disabled={isDeleting}
                >
                  <HiTrash className='h-5 w-5' />
                  Supprimer
                </button>
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
              Êtes-vous sûr de vouloir supprimer le livre "
              <span className='font-semibold'>{book.title}</span>" ? Cette
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

      {/* Description Card */}
      {book.description && (
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title text-xl mb-4'>
              <HiDocumentText className='h-6 w-6' />
              Description
            </h2>
            <p className='leading-relaxed text-base-content/90'>
              {book.description}
            </p>
          </div>
        </div>
      )}

      {/* Recommendation Card */}
      {book.recommendation && (
        <div className='card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl border border-primary/20'>
          <div className='card-body'>
            <h2 className='card-title text-xl mb-4'>
              <HiStar className='h-6 w-6 text-primary' />
              Recommandation libraire
            </h2>
            <div className='bg-base-100 rounded-lg p-4 border-l-4 border-primary'>
              <p className='leading-relaxed italic text-base-content/90'>
                "{book.recommendation}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;
