'use client';

import React, { useState } from 'react';

interface Librarian {
  _id: string;
  firstName: string;
  lastName: string;
}

interface AssignmentFieldsProps {
  // Librarian assignment props
  librarians: Librarian[];
  loadingLibrarians: boolean;
  assignedTo?: string[];
  onAssignedToChange: (ids: string[]) => void;

  // Sections props
  sections?: string[];
  onSectionsChange: (sections: string[]) => void;

  // Optional labels for i18n
  librarianLabel?: string;
  sectionsLabel?: string;
  emptyLibrariansText?: string;
  sectionPlaceholder?: string;
}

/**
 * Reusable component for StoreAdmin assignment fields
 * Handles both librarian assignment and section/category management
 */
const AssignmentFields: React.FC<AssignmentFieldsProps> = ({
  librarians,
  loadingLibrarians,
  assignedTo = [],
  onAssignedToChange,
  sections = [],
  onSectionsChange,
  librarianLabel = 'Assigner à des libraires',
  sectionsLabel = 'Sections / Rayons',
  emptyLibrariansText = 'Aucun libraire disponible',
  sectionPlaceholder = 'Ajouter une section (ex: Fiction, Jeunesse...)',
}) => {
  const [newSection, setNewSection] = useState('');

  const handleAddSection = () => {
    const trimmedSection = newSection.trim();
    if (trimmedSection && !sections.includes(trimmedSection)) {
      onSectionsChange([...sections, trimmedSection]);
      setNewSection('');
    }
  };

  const handleRemoveSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
  };

  const handleSectionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSection();
    }
  };

  return (
    <>
      {/* Librarian Assignment */}
      <label className='label w-full max-w-md text-center mt-2'>
        {librarianLabel}
      </label>
      {loadingLibrarians ? (
        <div className='flex justify-center w-full max-w-md'>
          <span className='loading loading-spinner loading-md'></span>
        </div>
      ) : (
        <select
          multiple
          value={assignedTo}
          onChange={(e) => {
            const selectedOptions = Array.from(
              e.target.selectedOptions,
              (option) => option.value
            );
            onAssignedToChange(selectedOptions);
          }}
          className='select select-multiple w-full max-w-md h-32'
        >
          {librarians.length === 0 ? (
            <option disabled>{emptyLibrariansText}</option>
          ) : (
            librarians.map((librarian) => (
              <option key={librarian._id} value={librarian._id}>
                {librarian.firstName} {librarian.lastName}
              </option>
            ))
          )}
        </select>
      )}
      <p className='text-xs text-base-content/60 max-w-md text-center mt-1'>
        Maintenez Cmd (Mac) ou Ctrl (Windows) pour sélectionner plusieurs
        bibliothécaires
      </p>

      {/* Sections Management */}
      <label className='label w-full max-w-md text-center mt-6'>
        {sectionsLabel}
      </label>
      <div className='w-full max-w-md'>
        <div className='flex gap-2 mb-2'>
          <input
            type='text'
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            onKeyDown={handleSectionKeyDown}
            className='input flex-1'
            placeholder={sectionPlaceholder}
          />
          <button
            type='button'
            onClick={handleAddSection}
            className='btn btn-primary'
            disabled={!newSection.trim()}
          >
            Ajouter
          </button>
        </div>

        {/* Display sections as badges */}
        {sections.length > 0 && (
          <div className='flex flex-wrap gap-2 mt-3'>
            {sections.map((section, index) => (
              <span key={index} className='badge badge-primary badge-lg gap-2'>
                {section}
                <button
                  type='button'
                  onClick={() => handleRemoveSection(index)}
                  className='btn btn-ghost btn-xs btn-circle'
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AssignmentFields;
