import Link from 'next/link';
import bookData from '../../lib/mock/books.json';
import {
  HiShoppingBag,
  HiPencilAlt,
  HiTrash,
  HiDocumentText,
  HiStar,
} from 'react-icons/hi';

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
    <div className='max-w-6xl mx-auto space-y-6'>
      {/* Header Card */}
      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <div className='flex flex-col lg:flex-row gap-8'>
            {/* Book Cover */}
            <div className='flex-shrink-0 mx-auto lg:mx-0'>
              <div className='relative'>
                <img
                  src={book.bookData.cover}
                  alt={book.bookData.title}
                  className='w-48 h-auto rounded-lg shadow-2xl'
                />
              </div>
            </div>

            {/* Book Information */}
            <div className='flex-1 space-y-6'>
              <div>
                <h1 className='card-title text-2xl font-bold mb-3'>
                  {book.bookData.title}
                </h1>
                <p className='text-xl text-base-content/80 mb-4'>
                  par {book.bookData.authors.join(', ')}
                </p>

                {/* Genre Badges */}
                <div className='flex flex-wrap gap-2 mb-4'>
                  <div className='badge badge-primary badge-lg'>
                    {book.genre}
                  </div>
                  <div className='badge badge-secondary badge-lg'>
                    {book.tone}
                  </div>
                  <div className='badge badge-accent badge-lg'>
                    {book.ageGroup}
                  </div>
                </div>
              </div>

              {/* Book Stats */}
              <div className='stats shadow bg-base-300'>
                <div className='stat'>
                  <div className='stat-title'>Pages</div>
                  <div className='stat-value text-xl text-primary'>
                    {book.bookData.pageCount}
                  </div>
                </div>

                <div className='stat'>
                  <div className='stat-title'>Éditeur</div>
                  <div className='stat-value text-xl'>
                    {book.bookData.publisher}
                  </div>
                </div>

                <div className='stat'>
                  <div className='stat-title'>ISBN</div>
                  <div className='stat-value text-sm font-mono'>
                    {book.isbn}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='card-actions justify-start flex-wrap gap-6'>
                <a
                  href={book.purchaseLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn btn-soft btn-secondary'
                >
                  <HiShoppingBag className='h-5 w-5' />
                  Lien boutique
                </a>
                <Link
                  href={`/dashboard/books/${book.isbn}/edit`}
                  className='btn btn-soft btn-primary'
                >
                  <HiPencilAlt className='h-5 w-5' />
                  Modifier
                </Link>
                <button className='btn btn-soft btn-error'>
                  <HiTrash className='h-5 w-5' />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-xl mb-4'>
            <HiDocumentText className='h-6 w-6' />
            Description
          </h2>
          <p className='leading-relaxed text-base-content/90'>
            {book.bookData.description}
          </p>
        </div>
      </div>

      {/* Recommendation Card */}
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
    </div>
  );
};

export default BookDetails;
