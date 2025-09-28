import Link from 'next/link';

interface BookProps {
  coverUrl?: string;
  isbn?: string;
  title?: string;
}

const Book = ({ coverUrl, isbn, title }: BookProps) => {
  const bookIsbn = isbn || '1293847562821';
  const bookCoverUrl =
    coverUrl ||
    'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759074962/la_femme_de_menage_hom3dr.webp';

  return (
    <div className='flex w-[121px] h-[170px] relative flex-shrink-0 items-center justify-center'>
      <div className=''>
        <Link href={`/dashboard/books/${bookIsbn}`}>
          <img
            src={bookCoverUrl}
            alt={title || 'Couverture non disponible'}
            className={`w-full h-full cursor-pointer hover:scale-105 transition-all duration-200
            }`}
            style={{ width: '121px', height: '170px' }}
          />
        </Link>
      </div>
    </div>
  );
};

export default Book;
