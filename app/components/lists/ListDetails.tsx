import Link from 'next/link';
import listData from '../../lib/mock/lists.json';
import booksData from '../../lib/mock/books.json';
import {
  formatDate,
  getVisibilityConfig,
  findBookAndExtractProps,
} from '../../lib/utils';
import Book from '../books/Book';

interface ListDetailsProps {
  listId: string;
}

const ListDetails = ({ listId }: ListDetailsProps) => {
  // Find the list by _id passed from the URL
  const list = listData.find((list) => list._id === listId);

  if (!list) {
    return (
      <div role='alert' className='alert alert-soft alert-error'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6 shrink-0 stroke-current'
          fill='none'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
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
              <div className='avatar'>
                <div className='w-[121px] h-[170px] rounded-xl shadow-lg'>
                  <img
                    src={list.coverImage}
                    alt={list.title}
                    className='object-cover'
                  />
                </div>
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
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    />
                  </svg>
                  Modifier
                </Link>
                <button className='btn btn-soft btn-error'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
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
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                />
              </svg>
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
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-16 w-16 mx-auto text-base-content/40 mb-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1}
                  d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                />
              </svg>
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
