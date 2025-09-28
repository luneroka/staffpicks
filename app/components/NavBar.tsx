import React from 'react';
import { FaRegEdit, FaUserCircle } from 'react-icons/fa';

const NavBar = () => {
  return (
    <nav className='flex justify-between px-16 py-4 border-b border-b-card-background'>
      {/* LEFT */}
      <h3>Genève - Balexert</h3>

      {/* MIDDLE */}
      <div className='flex gap-8'>
        <div className='header-btn flex items-center gap-2'>
          <FaRegEdit />
          Mes livres
        </div>
        <div className='header-btn flex items-center gap-2'>
          <FaRegEdit />
          Mes listes
        </div>
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
