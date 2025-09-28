'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaRegEdit, FaUserCircle, FaArrowCircleLeft } from 'react-icons/fa';

const NavBar = () => {
  const pathname = usePathname();

  // Dashboard
  if (pathname == '/dashboard') {
    return (
      <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
        {/* LEFT */}
        <Link href={'/dashboard'}>
          <h3 className='home-link'>Genève - Balexert</h3>
        </Link>

        {/* MIDDLE */}
        <div className='flex gap-8'>
          <Link href='/dashboard/books'>
            <div className='header-btn flex items-center gap-2'>
              <FaRegEdit />
              Mes livres
            </div>
          </Link>
          <Link href='/dashboard/lists'>
            <div className='header-btn flex items-center gap-2'>
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
  }

  if (pathname == '/dashboard/books') {
    return (
      <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
        {/* LEFT */}
        <Link href={'/dashboard'}>
          <h3 className='home-link'>Genève - Balexert</h3>
        </Link>

        {/* MIDDLE */}
        <div className='flex gap-8'>
          {/* <Link href='/dashboard'>
            <div className='header-btn flex items-center gap-2'>
              <FaArrowCircleLeft />
              Dashboard
            </div>
          </Link> */}
          <Link href='/dashboard/lists'>
            <div className='header-btn flex items-center gap-2'>
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
  }

  if (pathname == '/dashboard/lists') {
    return (
      <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
        {/* LEFT */}
        <Link href={'/dashboard'}>
          <h3 className='home-link'>Genève - Balexert</h3>
        </Link>

        {/* MIDDLE */}
        <div className='flex gap-8'>
          {/* <Link href='/dashboard'>
            <div className='header-btn flex items-center gap-2'>
              <FaArrowCircleLeft />
              Dashboard
            </div>
          </Link> */}
          <Link href='/dashboard/books'>
            <div className='header-btn flex items-center gap-2'>
              <FaRegEdit />
              Mes livres
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

  if (
    pathname == '/dashboard/books/new' ||
    pathname == '/dashboard/lists/new'
  ) {
    return (
      <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
        {/* LEFT */}
        <Link href={'/dashboard'}>
          <h3 className='home-link'>Genève - Balexert</h3>
        </Link>

        {/* MIDDLE */}
        <div className='flex gap-8'>
          <Link href='/dashboard/books'>
            <div className='abort-btn flex items-center gap-2'>
              <FaArrowCircleLeft />
              Annuler
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
};

export default NavBar;
