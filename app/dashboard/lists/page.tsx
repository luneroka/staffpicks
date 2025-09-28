import Link from 'next/link';

const Lists = () => {
  return (
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/lists/new'}>
        <div className='add-item-btn w-fit'>
          <h3>Ajouter une liste</h3>
        </div>
      </Link>
    </div>
  );
};

export default Lists;
