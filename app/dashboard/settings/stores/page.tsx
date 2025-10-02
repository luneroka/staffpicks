import Link from 'next/link';
import { requireCompanyAdmin } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { StoreModel } from '@/app/lib/models/Store';
import { UserModel } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import { FaStore, FaPlus, FaArrowLeft } from 'react-icons/fa';

const StoresSettings = async () => {
  // Require company admin access
  const session = await requireCompanyAdmin();

  await connectDB();

  // Fetch stores for the company
  const stores = await StoreModel.find({
    companyId: new Types.ObjectId(session.companyId!),
  })
    .sort({ createdAt: -1 })
    .lean();

  // Get librarian counts for each store
  const storesWithCounts = await Promise.all(
    stores.map(async (store: any) => {
      const librarianCount = await UserModel.countDocuments({
        storeId: store._id,
        role: { $in: ['librarian', 'storeAdmin'] },
      });

      return {
        _id: store._id.toString(),
        code: store.code,
        name: store.name,
        status: store.status,
        city: store.address?.city || 'Non renseignée',
        librarianCount,
      };
    })
  );

  return (
    <div className='space-y-6'>
      <Link href='/dashboard/settings/'>
        <button className='btn btn-ghost mb-4'>
          <FaArrowLeft />
          Retour
        </button>
      </Link>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <FaStore />
            Magasins
          </h1>
          <p className='text-base-content/60 mt-2'>
            Gérez vos magasins et leurs paramètres
          </p>
        </div>
        <Link href='/dashboard/settings/stores/new'>
          <button className='btn btn-soft btn-primary'>
            <FaPlus /> Nouveau magasin
          </button>
        </Link>
      </div>

      {/* Stores Table */}
      {storesWithCounts.length === 0 ? (
        <div className='card bg-base-200 shadow-sm'>
          <div className='card-body text-center py-12'>
            <FaStore className='text-5xl text-base-content/30 mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Aucun magasin</h3>
            <p className='text-base-content/60 mb-4'>
              Commencez par créer votre premier magasin
            </p>
            <Link href='/dashboard/settings/stores/new'>
              <button className='btn btn-primary'>
                <FaPlus /> Créer un magasin
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className='card bg-base-200 shadow-sm'>
          <div className='card-body'>
            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom du magasin</th>
                    <th>Ville</th>
                    <th>Libraires</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storesWithCounts.map((store) => (
                    <tr key={store._id} className='hover'>
                      <td className='font-mono text-sm'>{store.code}</td>
                      <td className='font-semibold'>{store.name}</td>
                      <td>{store.city}</td>
                      <td>
                        <span className='badge badge-ghost'>
                          {store.librarianCount}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            store.status === 'active'
                              ? 'badge-success'
                              : store.status === 'inactive'
                              ? 'badge-error'
                              : 'badge-warning'
                          }`}
                        >
                          {store.status === 'active' && 'Actif'}
                          {store.status === 'inactive' && 'Inactif'}
                          {store.status === 'maintenance' && 'Maintenance'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/dashboard/settings/stores/${store._id}`}>
                          <button className='btn btn-ghost btn-sm'>
                            Voir détails
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresSettings;
