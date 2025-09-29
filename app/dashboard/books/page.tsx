import Link from 'next/link';
import booksData from '../../lib/mock/books.json';
import Book from '@/app/components/Book';
import { IoIosArrowForward } from 'react-icons/io';

const Books = () => {
  return (
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/books/new'}>
        <div className='add-item-btn w-fit'>
          <h3>Ajouter un livre</h3>
        </div>
      </Link>

      <div className='flex flex-col gap-8'>
        <div className='flex gap-2 items-center'>
          <h2 className='h2-light'>Mes livres</h2>
          <IoIosArrowForward />
        </div>
        {/* Books mapped dynamically from JSON data */}
        <div id='book-display' className='flex flex-wrap gap-8'>
          {booksData.map((book) => (
            <Book
              key={book._id}
              coverUrl={book.bookData.cover}
              isbn={book.isbn}
              title={book.bookData.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Books;
