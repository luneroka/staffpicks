'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';

interface BookProps {
  coverUrl?: string;
  isbn?: string;
  title?: string;
}

const Book = ({ coverUrl, isbn, title }: BookProps) => {
  const pathname = usePathname();

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/books')) {
    return (
      <div className='flex w-[121px] h-[170px] relative flex-shrink-0 items-center justify-center'>
        <div className='hover:scale-105 transition-all duration-200'>
          <Link href={`/dashboard/books/${isbn}`}>
            <img
              src={coverUrl}
              alt={title || 'Couverture non disponible'}
              className='w-full h-full cursor-pointer'
              style={{ width: '121px', height: '170px' }}
            />
          </Link>
        </div>
      </div>
    );
  }

  if (pathname.startsWith('/dashboard/lists')) {
    return (
      <div className='relative'>
        <div className='flex w-[96px] h-[135px] relative flex-shrink-0 items-center justify-center'>
          <div>
            <Link href={`/dashboard/books/${isbn}`}>
              <img
                src={coverUrl}
                alt={title || 'Couverture non disponible'}
                className='w-full h-full cursor-pointer'
                style={{ width: '96px', height: '135px' }}
              />
            </Link>
          </div>
        </div>
        <button
          type='button'
          className='absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1 hover:scale-110 transition-transform cursor-pointer'
        >
          <FaTimes className='w-3 h-3' />
        </button>
      </div>
    );
  }
};

export default Book;
