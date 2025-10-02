import BackButton from '@/app/components/BackButton';
import ListForm from '@/app/components/forms/ListForm';

const AddList = () => {
  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <div className='flex items-start justify-center'>
        <ListForm />
      </div>
    </div>
  );
};

export default AddList;
