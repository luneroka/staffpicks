import Link from 'next/link';
import booksData from '../../lib/mock/books.json';
import Book from '@/app/components/Book';

const Books = () => {
  return (
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/books/new'}>
        <div className='add-item-btn w-fit'>
          <h3>Ajouter un livre</h3>
        </div>
      </Link>

      <div className='flex flex-col gap-8'>
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
