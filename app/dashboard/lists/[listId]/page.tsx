import ListDetails from '@/app/components/lists/ListDetails';

interface ListPageProps {
  params: Promise<{
    listId: string;
  }>;
}

const ListPage = async ({ params }: ListPageProps) => {
  const { listId } = await params;

  return (
    <div>
      <ListDetails listId={listId} />
    </div>
  );
};

export default ListPage;
