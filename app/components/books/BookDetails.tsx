import Link from 'next/link';
import {
  HiShoppingBag,
  HiPencilAlt,
  HiTrash,
  HiDocumentText,
  HiStar,
} from 'react-icons/hi';

interface BookDetailsProps {
  book: {
    id: string;
    isbn: string;
    title: string;
    authors: string[];
    cover?: string;
    description?: string;
    publisher?: string;
    pageCount?: number;
    publishDate?: Date;
    genre?: string;
    tone?: string;
    ageGroup?: string;
    purchaseLink?: string;
    recommendation?: string;
    owner?: {
      name: string;
      email: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
  };
}

const BookDetails = ({ book }: BookDetailsProps) => {
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
                  src={book.cover || '/placeholder-book-cover.jpg'}
                  alt={book.title}
                  className='w-48 h-auto rounded-lg shadow-2xl'
                />
              </div>
            </div>

            {/* Book Information */}
            <div className='flex-1 space-y-6'>
              <div>
                <h1 className='card-title text-2xl font-bold mb-3'>
                  {book.title}
                </h1>
                <p className='text-xl text-base-content/80 mb-4'>
                  par {book.authors.join(', ')}
                </p>

                {/* Genre Badges */}
                <div className='flex flex-wrap gap-2 mb-4'>
                  {book.genre && (
                    <div className='badge badge-primary badge-lg'>
                      {book.genre}
                    </div>
                  )}
                  {book.tone && (
                    <div className='badge badge-secondary badge-lg'>
                      {book.tone}
                    </div>
                  )}
                  {book.ageGroup && (
                    <div className='badge badge-accent badge-lg'>
                      {book.ageGroup}
                    </div>
                  )}
                </div>
              </div>

              {/* Book Stats */}
              <div className='stats shadow bg-base-300'>
                {book.pageCount && (
                  <div className='stat'>
                    <div className='stat-title'>Pages</div>
                    <div className='stat-value text-xl text-primary'>
                      {book.pageCount}
                    </div>
                  </div>
                )}

                {book.publisher && (
                  <div className='stat'>
                    <div className='stat-title'>Éditeur</div>
                    <div className='stat-value text-xl'>{book.publisher}</div>
                  </div>
                )}

                <div className='stat'>
                  <div className='stat-title'>ISBN</div>
                  <div className='stat-value text-sm font-mono'>
                    {book.isbn}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='card-actions justify-start flex-wrap gap-6'>
                {book.purchaseLink && (
                  <a
                    href={book.purchaseLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-soft btn-secondary'
                  >
                    <HiShoppingBag className='h-5 w-5' />
                    Lien boutique
                  </a>
                )}
                <Link
                  href={`/dashboard/books/${book.id}/edit`}
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
      {book.description && (
        <div className='card bg-base-200 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title text-xl mb-4'>
              <HiDocumentText className='h-6 w-6' />
              Description
            </h2>
            <p className='leading-relaxed text-base-content/90'>
              {book.description}
            </p>
          </div>
        </div>
      )}

      {/* Recommendation Card */}
      {book.recommendation && (
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
      )}
    </div>
  );
};

export default BookDetails;
