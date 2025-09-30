import ListForm from '@/app/components/forms/ListForm';
import React from 'react';

interface EditListPageProps {
  params: Promise<{
    listId: string;
  }>;
}

const EditListPage = async ({ params }: EditListPageProps) => {
  const { listId } = await params;

  return (
    <div className='mt-[-32px] flex items-start justify-center p-4 md:p-8'>
      <ListForm listId={listId} />
    </div>
  );
};

export default EditListPage;
