import Link from 'next/link';
import listData from '../../lib/mock/lists.json';
import booksData from '../../lib/mock/books.json';
import {
  formatDate,
  getVisibilityConfig,
  findBookAndExtractProps,
} from '../../lib/utils';
import Book from '../books/Book';
import {
  HiExclamationCircle,
  HiPencilAlt,
  HiTrash,
  HiBookOpen,
} from 'react-icons/hi';

interface ListDetailsProps {
  listId: string;
}

const ListDetails = ({ listId }: ListDetailsProps) => {
  // Find the list by _id passed from the URL
  const list = listData.find((list) => list._id === listId);

  if (!list) {
    return (
      <div role='alert' className='alert alert-soft alert-error'>
        <HiExclamationCircle className='h-6 w-6 shrink-0 stroke-current' />
        <span>List not found</span>
      </div>
    );
  }

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
                  src={list.coverImage}
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
                    className={`badge badge-soft badge-lg ${visibilityConfig.badgeClass}`}
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
              <div className='stats shadow'>
                <div className='stat'>
                  <div className='stat-value text-primary'>
                    {list.items.length}
                  </div>
                  <div className='stat-desc'>livres dans cette liste</div>
                </div>

                <div className='stat'>
                  <div className='stat-title'>Créée par</div>
                  <div className='stat-value text-sm'>{list.createdBy}</div>
                  {list.visibility === 'public' && list.publishAt && (
                    <div className='stat-desc'>
                      Publiée le {formatDate(list.publishAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='card-actions justify-start'>
                <Link
                  href={`/dashboard/lists/${list._id}/edit`}
                  className='btn btn-soft btn-primary'
                >
                  <HiPencilAlt className='h-4 w-4' />
                  Modifier
                </Link>
                <button className='btn btn-soft btn-error'>
                  <HiTrash className='h-4 w-4' />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Section */}
      {list.items.length > 0 && (
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title text-xl mb-4'>
              <HiBookOpen className='h-6 w-6' />
              Livres de la liste
            </h2>
            <div className='flex gap-4'>
              {list.items.map((item) => {
                const bookProps = findBookAndExtractProps(
                  booksData,
                  item.bookId
                );
                if (!bookProps) return null;
                return <Book key={item.bookId} {...bookProps} />;
              })}
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
                href={`/dashboard/lists/${list._id}/edit`}
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
