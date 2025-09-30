import Link from 'next/link';
import { MdCancel } from 'react-icons/md';

interface BookProps {
  coverUrl?: string;
  isbn?: string;
  title?: string;
}

const Book = ({ coverUrl, isbn, title }: BookProps) => {
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
        <button className='absolute top-1 right-1 rounded-full hover:text-primary-btn text-error cursor-pointer hover:scale-150 transition-all duration-200'>
          <MdCancel className='size-5' />
        </button>
      </div>
    </div>
  );
};

export default Book;
