'use client';

import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import listsData from '@/app/lib/mock/lists.json';
import booksData from '@/app/lib/mock/books.json';
import { findBookAndExtractProps } from '@/app/lib/utils';
import Book from '../books/Book';

interface ListData {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  visibility: 'draft' | 'unlisted' | 'public';
  publishAt: string;
  items: Array<{
    bookId: string;
    position: number;
  }>;
}

interface BookSearchResult {
  _id: string;
  isbn: string;
  bookData: {
    title: string;
    cover: string;
    authors: string[];
  };
}

interface ListFormProps {
  listId?: string; // Optional prop for editing existing lists
}

const ListForm = ({ listId }: ListFormProps) => {
  const [listData, setListData] = useState<ListData>({
    title: '',
    slug: '',
    description: '',
    coverImage: '',
    visibility: 'draft',
    publishAt: '',
    items: [],
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Book search state
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load existing list data if listId is provided (for editing)
  useEffect(() => {
    if (listId) {
      setIsLoading(true);

      // Find the list by ID from mock data
      const existingList = listsData.find((list) => list._id === listId);

      if (existingList) {
        setListData({
          title: existingList.title,
          slug: existingList.slug,
          description: existingList.description || '',
          coverImage: existingList.coverImage || '',
          visibility: existingList.visibility as
            | 'draft'
            | 'unlisted'
            | 'public',
          publishAt: existingList.publishAt
            ? existingList.publishAt.split('T')[0]
            : '', // Convert to YYYY-MM-DD format
          items: existingList.items || [],
        });
      } else {
        setError(`Aucune liste trouvée avec l'ID: ${listId}`);
      }

      setIsLoading(false);
    }
  }, [listId]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setListData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setListData((prev) => ({
        ...prev,
        slug,
      }));
    }

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    // Clear general error when user modifies form
    if (error) {
      setError('');
    }
  };

  // Book search functionality
  const searchBooks = (query: string) => {
    console.log('Searching for:', query);
    console.log('Books data length:', booksData.length);

    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = booksData
      .filter(
        (book) =>
          book.bookData.title.toLowerCase().includes(query.toLowerCase()) ||
          book.bookData.authors.some((author) =>
            author.toLowerCase().includes(query.toLowerCase())
          ) ||
          book.isbn.includes(query)
      )
      .slice(0, 5); // Limit to 5 results

    console.log('Search results:', results);
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const addBookToList = (bookId: string) => {
    // Check if book is already in the list
    if (listData.items.some((item) => item.bookId === bookId)) {
      setError('Ce livre est déjà dans la liste');
      return;
    }

    const newPosition = listData.items.length + 1;
    setListData((prev) => ({
      ...prev,
      items: [...prev.items, { bookId, position: newPosition }],
    }));

    // Clear search
    setBookSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setError('');
  };

  const removeBookFromList = (bookId: string) => {
    setListData((prev) => ({
      ...prev,
      items: prev.items
        .filter((item) => item.bookId !== bookId)
        .map((item, index) => ({ ...item, position: index + 1 })), // Reorder positions
    }));
  };

  const resetForm = () => {
    setListData({
      title: '',
      slug: '',
      description: '',
      coverImage: '',
      visibility: 'draft',
      publishAt: '',
      items: [],
    });
    // Clear all messages when resetting
    setError('');
    setSuccess('');
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and success messages
    setError('');
    setSuccess('');
    setValidationErrors([]);

    // Basic validation
    const requiredFields = ['title', 'slug'];
    const missingFields = requiredFields.filter(
      (field) =>
        !listData[field as keyof Pick<ListData, 'title' | 'slug'>]?.trim()
    );

    if (missingFields.length > 0) {
      const fieldLabels: { [key: string]: string } = {
        title: 'Titre',
        slug: 'Slug',
      };

      const missingLabels = missingFields.map(
        (field) => fieldLabels[field] || field
      );
      setValidationErrors([
        `Champs obligatoires manquants: ${missingLabels.join(', ')}`,
      ]);
      return;
    }

    try {
      console.log('Submitting list data:', listData);
      // TODO: Add actual API call to save/update the list
      const isEditing = !!listId;
      setSuccess(
        isEditing ? 'Liste modifiée avec succès!' : 'Liste ajoutée avec succès!'
      );

      // Reset form after successful submission (only for new lists)
      if (!isEditing) {
        resetForm();
      }
      redirect('/dashboard/lists');
    } catch (error) {
      console.error('Error saving list:', error);
      const isEditing = !!listId;
      setError(
        error instanceof Error
          ? error.message
          : isEditing
          ? 'Erreur lors de la modification de la liste'
          : "Erreur lors de l'ajout de la liste"
      );
    }
  };

  // Show loading state when loading existing list data
  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='loading loading-spinner loading-lg'></div>
        <span className='ml-4'>Chargement des données de la liste...</span>
      </div>
    );
  }

  const isEditing = !!listId;

  return (
    <form onSubmit={handleSubmit} className='w-full max-w-4xl items-stretch'>
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border p-6 flex flex-col gap-2 items-center'>
        {/* Error and Success Messages */}
        {(error || success || validationErrors.length > 0) && (
          <div className='w-full mb-4'>
            {error && (
              <div className='alert alert-error alert-soft mb-1 shadow-sm'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='size-5 shrink-0 stroke-current'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm font-medium'>{error}</span>
              </div>
            )}

            {success && (
              <div className='alert alert-success alert-soft mb-1 shadow-sm'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='size-5 shrink-0 stroke-current'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm font-medium'>{success}</span>
              </div>
            )}
          </div>
        )}

        <legend className='fieldset-legend'>
          {isEditing ? 'Modifier la liste' : 'Détails de la liste'}
        </legend>

        <label className='label w-full max-w-md text-center'>Titre *</label>
        <input
          type='text'
          name='title'
          value={listData.title}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder='Saisissez le titre de la liste'
        />

        <label className='label w-full max-w-md text-center'>Description</label>
        <textarea
          name='description'
          value={listData.description}
          onChange={handleInputChange}
          className='textarea w-full max-w-md'
          placeholder='Description de la liste...'
          rows={4}
        />

        <label className='label w-full max-w-md text-center'>
          Image de couverture
        </label>
        <div className='flex items-center gap-4 w-full max-w-md'>
          <img
            src={listData.coverImage || '/placeholder-list-cover.jpg'}
            alt='Couverture de la liste'
            className='w-[96px] h-[135px] object-cover border border-base-300 rounded cursor-pointer'
          />
          <input type='file' className='file-input file-input-ghost' />
        </div>

        <label className='label w-full max-w-md text-center'>Visibilité</label>
        <select
          name='visibility'
          value={listData.visibility}
          onChange={handleInputChange}
          className='select w-full max-w-md'
        >
          <option value='draft'>Brouillon</option>
          <option value='unlisted'>Non listée</option>
          <option value='public'>Publique</option>
        </select>

        {/* Book Search */}
        <div className='w-full max-w-md mx-auto mb-4'>
          <label className='label w-full max-w-md text-center mb-2'>
            Livres dans la liste
          </label>
          <div className='relative'>
            <input
              type='text'
              value={bookSearchQuery}
              onChange={(e) => {
                setBookSearchQuery(e.target.value);
                searchBooks(e.target.value);
              }}
              className='input w-full pr-10'
              placeholder='Rechercher un livre à ajouter...'
            />
            <FaSearch className='absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60' />

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className='absolute top-full left-0 right-0 bg-base-100 border border-base-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto'>
                {searchResults.map((book) => (
                  <div
                    key={book._id}
                    className='p-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0'
                    onClick={() => addBookToList(book._id)}
                  >
                    <div className='flex items-center gap-3'>
                      <img
                        src={book.bookData.cover}
                        alt={book.bookData.title}
                        className='w-8 h-12 object-cover rounded'
                      />
                      <div className='flex-1'>
                        <div className='font-medium text-sm'>
                          {book.bookData.title}
                        </div>
                        <div className='text-xs text-base-content/60'>
                          {book.bookData.authors.join(', ')}
                        </div>
                      </div>
                      <FaPlus className='text-primary' />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Books */}
        {listData.items.length > 0 && (
          <div className='w-full'>
            <p className='text-center mb-4 text-sm text-base-content/70'>
              {listData.items.length} livre(s) sélectionné(s)
            </p>
            <div className='flex flex-wrap gap-4 justify-center'>
              {listData.items.map((item) => {
                const bookProps = findBookAndExtractProps(
                  booksData,
                  item.bookId
                );
                if (!bookProps) return null;

                return (
                  <div key={item.bookId} className='relative'>
                    <Book {...bookProps} />
                    <button
                      type='button'
                      onClick={() => removeBookFromList(item.bookId)}
                      className='absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1 hover:scale-110 transition-transform cursor-pointer'
                    >
                      <FaTimes className='w-3 h-3' />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className='alert alert-warning alert-soft mt-4 shadow-sm'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='size-5 shrink-0 stroke-current'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
            <div className='text-sm font-medium'>
              {validationErrors.map((validationError, index) => (
                <div key={index}>{validationError}</div>
              ))}
            </div>
          </div>
        )}

        <div className='flex gap-4 mt-6 w-full max-w-md'>
          <button
            type='button'
            className={`btn btn-soft dark:btn-secondary flex-1 ${
              isEditing ? 'hidden' : 'block'
            }`}
            onClick={resetForm}
          >
            Annuler
          </button>
          <button type='submit' className='btn btn-soft btn-primary flex-1'>
            {isEditing ? 'Modifier la liste' : 'Ajouter la liste'}
          </button>
        </div>
      </fieldset>
    </form>
  );
};

export default ListForm;
