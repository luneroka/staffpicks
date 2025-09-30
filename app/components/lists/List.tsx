import Link from 'next/link';

interface ListProps {
  coverUrl?: string;
  id?: string;
  title?: string;
}

const List = ({ coverUrl, id, title }: ListProps) => {
  return (
    <div className='card bg-base-200 shadow-sm cursor-pointer hover:scale-105 transition-all duration-200 p-4'>
      <div className='flex flex-col gap-2 w-[121px]'>
        {/* LIST TITLE */}
        <div className='flex items-center justify-center h-11'>
          <div className='small-text text-center font-semibold'>{title}</div>
        </div>

        {/* LIST COVER */}
        <div className='flex w-[121px] h-[170px] relative flex-shrink-0 items-center justify-center '>
          <div className=''>
            <Link href={`/dashboard/lists/${id}`}>
              <img
                src={coverUrl}
                alt={title || 'Couverture non disponible'}
                className='w-full h-full rounded-md'
                style={{ width: '121px', height: '170px' }}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;
