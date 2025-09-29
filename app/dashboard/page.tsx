import { IoIosArrowForward } from 'react-icons/io';
import List from '../components/List';
import Book from '../components/Book';
import booksData from '../lib/mock/books.json';
import listsData from '../lib/mock/lists.json';
import Link from 'next/link';

const Dashboard = () => {
  return (
    <div className='flex flex-col gap-16'>
      {/* LISTS SECTION */}
      <div className='flex flex-col gap-8'>
        <Link href='/dashboard/lists' className='group'>
          <div className='flex gap-2 items-center'>
            <h2 className='h2-light group-hover:underline'>
              Mes listes personnalisées
            </h2>
            <IoIosArrowForward />
          </div>
        </Link>

        {/* Lists filtered to show only public ones */}
        <div id='list-display' className='flex gap-8'>
          {listsData
            .filter((list) => list.visibility === 'public')
            .map((list) => (
              <List
                key={list._id}
                coverUrl={list.coverImage}
                title={list.title}
              />
            ))}
        </div>
      </div>

      {/* BOOKS SECTION */}
      <div className='flex flex-col gap-8'>
        <Link href='/dashboard/books' className='group'>
          <div className='flex gap-2 items-center'>
            <h2 className='h2-light group-hover:underline'>
              Mes recommandations par genre
            </h2>
            <IoIosArrowForward />
          </div>
        </Link>

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

export default Dashboard;
