import Link from 'next/link';
import { MdRemoveRedEye } from 'react-icons/md';

interface ListProps {
  coverUrl?: string;
  id?: string;
  title?: string;
  description?: string;
}

const List = ({ coverUrl, id, title, description }: ListProps) => {
  return (
    <div className='card card-side bg-base-200 shadow-sm cursor-pointer p-4 max-w-lg'>
      <figure className='flex-shrink-0'>
        <img
          src={coverUrl}
          alt={title || 'Couverture non disponible'}
          className='h-[170px] w-auto object-cover rounded-lg'
        />
      </figure>
      <div className='card-body'>
        <h2 className='card-title'>{title}</h2>
        <p>{description}</p>
        <div className='card-actions justify-end'>
          <Link href={`/dashboard/lists/${id}`}>
            <button className='btn btn-soft btn-primary'>
              <MdRemoveRedEye />
              Voir
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default List;
