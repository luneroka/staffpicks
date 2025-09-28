import Link from 'next/link';

interface ListProps {
  coverUrl?: string;
  id?: string;
  title?: string;
}

const List = ({ coverUrl, id, title }: ListProps) => {
  const listId = id || '12938475';
  const listCoverUrl =
    coverUrl ||
    'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075467/automne_fcsgkk.png';

  return (
    <div className='flex flex-col gap-2 w-[121px]'>
      {/* LIST TITLE */}
      <div className='flex items-center justify-center h-11'>
        <div className='small-text text-center'>{title}</div>
      </div>

      {/* LIST COVER */}
      <div className='flex w-[121px] h-[170px] relative flex-shrink-0 items-center justify-center'>
        <div className=''>
          <Link href={`/dashboard/lists/${listId}`}>
            <img
              src={listCoverUrl}
              alt={title || 'Couverture non disponible'}
              className={`w-full h-full cursor-pointer hover:scale-105 transition-all duration-200
            }`}
              style={{ width: '121px', height: '170px' }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default List;
