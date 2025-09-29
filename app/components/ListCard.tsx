import Link from 'next/link';
import React from 'react';
import { formatDate, getVisibilityConfig } from '../lib/utils';

interface Items {
  bookId: string;
  position: number;
  addedAt: string;
}

interface ListData {
  _id: string;
  coverImage: string;
  title?: string;
  visibility?: string;
  items?: Items[];
  updatedAt?: Date | string;
}

interface ListCardProps {
  listData?: ListData;
}

const ListCard = ({ listData }: ListCardProps) => {
  if (!listData) {
    return null;
  }

  const visibilityConfig = getVisibilityConfig(listData.visibility);

  return (
    <Link href={`/dashboard/lists/${listData._id}`}>
      <div className='bg-base-100 w-96 shadow-sm rounded-lg p-4 flex gap-8 cursor-pointer hover:scale-105 transition-all duration-200 min-w-lg'>
        {/* LIST COVER */}
        <div className='flex w-[121px] h-[170px] relative flex-shrink-0 items-center justify-center'>
          <img
            src={listData.coverImage}
            alt={listData.title || 'Couverture non disponible'}
            className={`w-full h-full
            }`}
            style={{ width: '121px', height: '170px' }}
          />
        </div>

        {/* LIST INFOS */}
        <div className='flex flex-col gap-4'>
          {/* List Title */}
          <p>{listData.title}</p>

          {/* List Visibility */}
          {visibilityConfig && (
            <div className={`badge badge-soft ${visibilityConfig.badgeClass}`}>
              {visibilityConfig.label}
            </div>
          )}

          {/* List Items */}
          <div className='flex gap-1'>
            <div>{listData.items?.length}</div>
            <p>livres</p>
          </div>

          {/* Last Updated At */}
          <div className='flex gap-1 text-muted-text'>
            <p className='small-text'>Dernière modification :</p>
            <div className='small-text'>{formatDate(listData.updatedAt)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListCard;
