'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import Book from '../books/Book';
import { ListFormData, ListItem } from '@/app/lib/types';
import { useFormState } from '@/app/lib/hooks';
import AssignmentFields from './AssignmentFields';
import FormAlerts from './FormAlerts';

interface BookSearchResult {
  id: string;
  isbn: string;
  title: string;
  cover?: string;
  authors: string[];
  genre?: string;
  tone?: string;
  ageGroup?: string;
}

interface ListFormProps {
  id?: string; // Optional prop for editing existing lists
  initialData?: ListFormData; // Pre-populated data for editing
  userRole?: string;
  storeId?: string;
}

const ListForm = ({ id, initialData, userRole, storeId }: ListFormProps) => {
  const router = useRouter();
  const {
    error,
    success,
    isLoading,
    setError,
    setSuccess,
    setIsLoading,
    clearMessages,
  } = useFormState();

  const [listData, setListData] = useState<ListFormData>({
    title: '',
    slug: '',
    description: '',
    coverImage: '',
    visibility: 'draft',
    publishAt: '',
    items: [],
    assignedTo: [],
    sections: [],
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Assignment state (for StoreAdmin)
  const [librarians, setLibrarians] = useState<any[]>([]);
  const [loadingLibrarians, setLoadingLibrarians] = useState(false);

  // Book search state
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Store selected books with full details
  const [selectedBooks, setSelectedBooks] = useState<BookSearchResult[]>([]);

  // Load existing list data if initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      setListData({
        id: initialData.id,
        title: initialData.title,
        slug: initialData.slug,
        description: initialData.description,
        coverImage: initialData.coverImage,
        visibility: initialData.visibility,
        publishAt: initialData.publishAt,
        items: initialData.items.map((item) => ({
          bookId: item.bookId,
          position: item.position,
        })),
        assignedTo: initialData.assignedTo || [],
        sections: initialData.sections || [],
      });

      // Load books into selectedBooks for display
      // Check if items have full book data (populated ListItem) or just references
      const books: BookSearchResult[] = initialData.items
        .filter((item): item is ListItem => {
          // Type guard: check if item has isbn, title, and authors (populated)
          return (
            'isbn' in item &&
            'title' in item &&
            'authors' in item &&
            item.isbn !== undefined &&
            item.title !== undefined &&
            item.authors !== undefined
          );
        })
        .map((item) => ({
          id: item.bookId,
          isbn: item.isbn,
          title: item.title,
          cover: item.cover,
          authors: item.authors,
          genre: item.genre,
          tone: item.tone,
          ageGroup: item.ageGroup,
        }));
      setSelectedBooks(books);
    }
  }, [initialData]);

  // Fetch librarians for assignment (only for StoreAdmin)
  useEffect(() => {
    if (userRole === 'storeAdmin' && storeId) {
      const fetchLibrarians = async () => {
        try {
          setLoadingLibrarians(true);
          const response = await fetch(
            `/api/users?storeId=${storeId}&role=librarian`
          );
          if (response.ok) {
            const data = await response.json();
            // Filter out inactive and suspended users
            const activeLibrarians = (data.users || []).filter(
              (user: any) => user.status === 'active'
            );
            setLibrarians(activeLibrarians);
          }
        } catch (error) {
          console.error('Error fetching librarians:', error);
        } finally {
          setLoadingLibrarians(false);
        }
      };

      fetchLibrarians();
    }
  }, [userRole, storeId]);

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

    // Auto-generate slug from title (only for new lists)
    if (name === 'title' && !id) {
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
  const searchBooks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);

    try {
      // Fetch books from API
      const response = await fetch(
        `/api/books?search=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search books');
      }

      // Transform API response to match our interface
      const results: BookSearchResult[] = data.books.map((book: any) => ({
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        cover: book.cover,
        authors: book.authors,
        genre: book.genre,
        tone: book.tone,
        ageGroup: book.ageGroup,
      }));

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Erreur lors de la recherche de livres');
    } finally {
      setIsSearching(false);
    }
  };

  const addBookToList = (book: BookSearchResult) => {
    // Check if book is already in the list
    if (listData.items.some((item) => item.bookId === book.id)) {
      setError('Ce livre est déjà dans la liste');
      return;
    }

    const newPosition = listData.items.length;
    setListData((prev) => ({
      ...prev,
      items: [...prev.items, { bookId: book.id, position: newPosition }],
    }));

    // Add to selected books for display
    setSelectedBooks((prev) => [...prev, book]);

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
        .map((item, index) => ({ ...item, position: index })), // Reorder positions
    }));

    // Remove from selected books
    setSelectedBooks((prev) => prev.filter((book) => book.id !== bookId));
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
    setSelectedBooks([]);
    // Clear all messages when resetting
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setSelectedFile(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop grande (max 5MB)");
      return;
    }

    setSelectedFile(file);
    setIsUploadingImage(true);
    setError('');

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'list-covers'); // Specify folder for list covers

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Update the cover image URL with Cloudinary URL
      setListData((prev) => ({
        ...prev,
        coverImage: data.url,
      }));

      setSuccess('Image uploadée avec succès!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'upload de l'image"
      );
      setSelectedFile(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and success messages
    setError('');
    setSuccess('');
    setValidationErrors([]);

    // Basic validation
    const requiredFields = ['title'];
    const missingFields = requiredFields.filter(
      (field) => !listData[field as keyof Pick<ListFormData, 'title'>]?.trim()
    );

    if (missingFields.length > 0) {
      const fieldLabels: { [key: string]: string } = {
        title: 'Titre',
      };

      const missingLabels = missingFields.map(
        (field) => fieldLabels[field] || field
      );
      setValidationErrors([
        `Champs obligatoires manquants: ${missingLabels.join(', ')}`,
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const isEditing = !!id;

      // Prepare the payload for the API
      const payload = {
        title: listData.title.trim(),
        description: listData.description?.trim(),
        coverImage: listData.coverImage || undefined,
        visibility: listData.visibility,
        publishAt: listData.publishAt || undefined,
        items: listData.items,
        // Include assignment fields if user is StoreAdmin
        ...(userRole === 'storeAdmin' && {
          assignedTo: listData.assignedTo || [],
          sections: listData.sections || [],
        }),
      };

      if (isEditing) {
        // Update existing list
        const response = await fetch(`/api/lists/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update list');
        }

        setSuccess('Liste modifiée avec succès!');

        // Redirect to the updated list detail page
        setTimeout(() => {
          router.push(`/dashboard/lists/${id}`);
          router.refresh();
        }, 1500);
      } else {
        // Create new list
        const response = await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create list');
        }

        // Show success toast
        toast.success(`Liste "${data.list.title}" ajoutée avec succès`);

        // Wait a moment for user to see the success state
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Redirect to lists page
        router.push('/dashboard/lists');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving list:', error);
      const isEditing = !!id;
      setError(
        error instanceof Error
          ? error.message
          : isEditing
          ? 'Erreur lors de la modification de la liste'
          : "Erreur lors de l'ajout de la liste"
      );
    } finally {
      setIsLoading(false);
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

  const isEditing = !!id;

  return (
    <form onSubmit={handleSubmit} className='w-full max-w-4xl items-stretch'>
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border p-6 flex flex-col gap-2 items-center'>
        {/* Error and Success Messages */}
        <FormAlerts
          error={error}
          success={success}
          validationErrors={validationErrors}
          variant='compact'
          className='w-full mb-4'
        />

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
          <div className='relative'>
            <img
              src={
                listData.coverImage ||
                'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075480/rentr%C3%A9e_litt%C3%A9raire_ac1clu.png'
              }
              alt='Couverture de la liste'
              className='w-[160px] h-[90px] object-cover border border-base-300 rounded cursor-pointer hover:scale-105 transition-all duration-200'
            />
            {isUploadingImage && (
              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded'>
                <span className='loading loading-spinner loading-md text-white'></span>
              </div>
            )}
          </div>
          <input
            type='file'
            className='file-input file-input-ghost'
            accept='image/*'
            onChange={handleFileChange}
            disabled={isUploadingImage || isLoading}
          />
        </div>

        <label className='label w-full max-w-md text-center'>Visibilité</label>
        <select
          name='visibility'
          value={listData.visibility}
          onChange={handleInputChange}
          className='select w-full max-w-md cursor-pointer'
        >
          <option value='draft'>Brouillon</option>
          <option value='unlisted'>Non listée</option>
          <option value='public'>Publique</option>
        </select>

        {/* Assignment fields - Only visible for StoreAdmin */}
        {userRole === 'storeAdmin' && (
          <AssignmentFields
            librarians={librarians}
            loadingLibrarians={loadingLibrarians}
            assignedTo={listData.assignedTo}
            onAssignedToChange={(ids) =>
              setListData({ ...listData, assignedTo: ids })
            }
            sections={listData.sections}
            onSectionsChange={(sections) =>
              setListData({ ...listData, sections })
            }
          />
        )}

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
                    key={book.id}
                    className='p-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0'
                    onClick={() => addBookToList(book)}
                  >
                    <div className='flex items-center gap-3'>
                      <img
                        src={book.cover || '/placeholder-book-cover.jpg'}
                        alt={book.title}
                        className='w-8 h-12 object-cover rounded'
                      />
                      <div className='flex-1'>
                        <div className='font-medium text-sm'>{book.title}</div>
                        <div className='text-xs text-base-content/60'>
                          {book.authors.join(', ')}
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
        {selectedBooks.length > 0 && (
          <div className='w-full'>
            <p className='text-center mb-4 text-sm text-base-content/70'>
              {selectedBooks.length} livre(s) sélectionné(s)
            </p>
            <div className='flex flex-wrap gap-4 justify-center'>
              {selectedBooks.map((book) => (
                <div key={book.id} className='relative'>
                  <Book id={book.id} coverUrl={book.cover} title={book.title} />
                  <button
                    type='button'
                    onClick={() => removeBookFromList(book.id)}
                    className='absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1 hover:scale-110 transition-transform cursor-pointer'
                  >
                    <FaTimes className='w-3 h-3' />
                  </button>
                </div>
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
