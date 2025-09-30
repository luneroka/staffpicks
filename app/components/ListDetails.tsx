import Link from 'next/link';
import listData from '../lib/mock/lists.json';
import booksData from '../lib/mock/books.json';
import {
  formatDate,
  getVisibilityConfig,
  findBookAndExtractProps,
} from '../lib/utils';
import Book from './Book';

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
    <div className='max-w-4xl'>
      <div className='flex flex-col gap-4'>
        {/* List Cover */}
        <div className='flex flex-shrink-0'>
          <img
            src={list.coverImage}
            alt={list.title}
            className='w-16 h-auto shadow-lg'
          />
        </div>

        {/* List Details */}
        <div>Nom : {list.title}</div>
        <div>Créée par : {list.createdBy}</div>
        <div>Description : {list.description}</div>

        {/* List Visibility */}
        {visibilityConfig && (
          <div>
            <span>Statut: </span>
            <div className={`badge badge-soft ${visibilityConfig.badgeClass}`}>
              {visibilityConfig.label}
            </div>
          </div>
        )}

        {/* Pusblished At */}
        {list.visibility === 'public' && (
          <div>Publiée le : {formatDate(list.publishAt)}</div>
        )}

        {/* List Items */}
        <p>Livres dans la liste :</p>
        <div className='flex gap-4'>
          {list.items.map((item) => {
            // Find and extract book props using utility function
            const bookProps = findBookAndExtractProps(booksData, item.bookId);

            if (!bookProps) return null;

            return <Book key={item.bookId} {...bookProps} />;
          })}
        </div>

        {/* Action Button */}
        <div className='flex gap-4 mt-6'>
          <div className='btn btn-soft btn-warning'>
            <Link href={`/dashboard/lists/${list._id}/edit`}>Modifier</Link>
          </div>
          <div className='btn btn-error dark:btn-secondary btn-soft'>
            Supprimer
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListDetails;
