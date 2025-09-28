import Link from 'next/link';

const Books = () => {
  return (
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/books/new'}>
        <div className='add-item-btn w-fit'>
          <h3>Ajouter un livre</h3>
        </div>
      </Link>
    </div>
  );
};

export default Books;
