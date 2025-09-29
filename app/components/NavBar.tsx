'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaRegEdit,
  FaUserCircle,
  FaArrowCircleLeft,
} from 'react-icons/fa';

const NavBar = () => {
  const pathname = usePathname();

  if (
    pathname == '/dashboard/books/new' ||
    pathname == '/dashboard/lists/new'
  ) {
    return (
      <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
        {/* LEFT */}
        <Link href={'/dashboard'}>
          <div className='flex items-center gap-2 home-link'>
            {/* TODO: Use company logo from db */}
            <FaHome />
            {/* TODO: Use store name from db */}
            <h3>Genève - Balexert</h3>
          </div>
        </Link>

        {/* MIDDLE */}
        <div className='flex gap-8'>
          <Link href='/dashboard/books'>
            <div className='btn btn-soft btn-error flex items-center gap-2'>
              <FaArrowCircleLeft />
              Retour
            </div>
          </Link>
        </div>

        {/* RIGHT */}
        <div className='flex gap-2 items-center'>
          <h3>Sarah</h3>
          <FaUserCircle className='size-8' />
        </div>
      </nav>
    );
  }

  return (
    <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
      {/* LEFT */}
      <Link href={'/dashboard'}>
        <div className='flex items-center gap-2 home-link'>
          {/* TODO: Use company logo from db */}
          <FaHome />
          {/* TODO: Use store name from db */}
          <h3>Genève - Balexert</h3>
        </div>
      </Link>

      {/* MIDDLE */}
      <div role='tablist' className='tabs tabs-border'>
        <Link
          href='/dashboard/books'
          role='tab'
          className={`tab ${
            pathname === '/dashboard/books' ? 'tab-active' : ''
          }`}
        >
          <div className='flex items-center gap-2'>
            <FaRegEdit />
            Mes livres
          </div>
        </Link>
        <Link
          href='/dashboard/lists'
          role='tab'
          className={`tab ${
            pathname === '/dashboard/lists' ? 'tab-active' : ''
          }`}
        >
          <div className='flex items-center gap-2'>
            <FaRegEdit />
            Mes listes
          </div>
        </Link>
      </div>

      {/* RIGHT */}
      <div className='flex gap-2 items-center'>
        <h3>Sarah</h3>
        <FaUserCircle className='size-8' />
      </div>
    </nav>
  );
};

export default NavBar;
