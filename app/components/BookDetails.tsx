import Link from 'next/link';
import bookData from '../lib/mock/books.json';

interface BookDetailsProps {
  bookIsbn: string;
}

const BookDetails = ({ bookIsbn }: BookDetailsProps) => {
  // Find the book by ISBN (bookIsbn is the ISBN passed from the URL)
  const book = bookData.find((book) => book.isbn === bookIsbn);

  if (!book) {
    return (
      <div role='alert' className='alert alert-error w-fit'>
        Book not found
      </div>
    );
  }

  return (
    <div className='max-w-4xl'>
      <div className='flex flex-col md:flex-row gap-8'>
        {/* Book Cover */}
        <div className='flex-shrink-0'>
          <img
            src={book.bookData.cover}
            alt={book.bookData.title}
            className='w-64 h-auto shadow-lg'
          />
        </div>

        {/* Book Details */}
        <div className='flex-1'>
          <h2 className='font-bold mb-2'>{book.bookData.title}</h2>
          <p className='text-main-text mb-6'>
            de {book.bookData.authors.join(', ')}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div className='small-text'>
              <span className='font-semibold'>Genre :</span> {book.genre}
            </div>
            <div className='small-text'>
              <span className='font-semibold'>Ton :</span> {book.tone}
            </div>
            <div className='small-text'>
              <span className='font-semibold'>Catégorie d'âge :</span>{' '}
              {book.ageGroup}
            </div>
            <div className='small-text'>
              <span className='font-semibold'>Éditions :</span>{' '}
              {book.bookData.publisher}
            </div>
            <div className='small-text'>
              <span className='font-semibold'>ISBN :</span> {book.isbn}
            </div>
          </div>

          <div className='mb-6'>
            <p className='font-semibold mb-1'>Description</p>
            <p className='small-text'>{book.bookData.description}</p>
          </div>

          <div className='mb-6'>
            <p className='font-semibold mb-1'>Recommandation libraire</p>
            <p className='small-text'>{book.recommendation}</p>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-8'>
            <div className='flex gap-4 btn btn-warning text-main-text'>
              <a
                href={book.fnacLink}
                target='_blank'
                rel='noopener noreferrer'
                className=''
              >
                Voir sur Fnac.ch
              </a>
            </div>
            <div className='btn'>
              <Link href={`/dashboard/books/${book.isbn}/edit`}>Modifier</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
