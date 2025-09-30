'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUserCircle } from 'react-icons/fa';
import { useEffect } from 'react';
import { themeChange } from 'theme-change';
import { MdDarkMode } from 'react-icons/md';

const NavBar = () => {
  useEffect(() => {
    themeChange(false);
    // 👆 false parameter is required for react project
  }, []);

  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login' || pathname === 'register') {
    return (
      <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
        {/* LEFT */}
        <Link href={'/'}>
          <div className='flex items-center gap-2 home-link'>
            {/* TODO: Use company logo from db */}
            <FaHome />
          </div>
        </Link>
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
          className={`tab  ${
            pathname === '/dashboard/books' ? 'tab-active' : ''
          }`}
        >
          <div className='flex items-center gap-2 '>Mes livres</div>
        </Link>
        <Link
          href='/dashboard/lists'
          role='tab'
          className={`tab  ${
            pathname === '/dashboard/lists' ? 'tab-active' : ''
          }`}
        >
          <div className='flex items-center gap-2 '>Mes listes</div>
        </Link>
      </div>

      {/* Floating Dark Mode Button */}
      <button
        data-toggle-theme='dim,light'
        data-act-class='ACTIVECLASS'
        className='fixed bottom-4 right-4 z-50 bg-base-200 hover:bg-secondary-accent p-3 rounded-full shadow-lg transition-colors cursor-pointer'
      >
        <MdDarkMode className='size-6' />
      </button>

      {/* RIGHT */}
      <div className='flex gap-2 items-center '>
        <h3>Sarah</h3>
        <FaUserCircle className='size-8' />
      </div>
    </nav>
  );
};

export default NavBar;
