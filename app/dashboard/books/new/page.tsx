import BackButton from '@/app/components/BackButton';
import BookForm from '@/app/components/forms/BookForm';

const AddBook = () => {
  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <div className='flex items-start justify-center'>
        <BookForm />
      </div>
    </div>
  );
};

export default AddBook;
