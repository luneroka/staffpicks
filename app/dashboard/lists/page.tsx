import Link from 'next/link';
import listsData from '../../lib/mock/lists.json';
import ListCard from '@/app/components/ListCard';

const Lists = () => {
  return (
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/lists/new'}>
        <div className='btn btn-soft btn-primary w-fit'>Ajouter une liste</div>
      </Link>

      <div id='list-display' className='flex flex-wrap gap-8'>
        {listsData.map((list) => (
          <ListCard key={list._id} listData={list} />
        ))}
      </div>
    </div>
  );
};

export default Lists;
