'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';
import { genres, tones, ageGroups } from '@/app/lib/facets';
import { BookFormData } from '@/app/lib/types';
import { useFormState, useImageUpload } from '@/app/lib/hooks';
import AssignmentFields from './AssignmentFields';
import FormAlerts from './FormAlerts';

interface BookEditFormProps {
  bookId?: string; // Optional book ID for editing existing books
  initialData?: BookFormData; // Pre-populated data for editing
  userRole?: string; // User role to determine if assignment fields should be shown
  storeId?: string; // Store ID for fetching librarians
}

const BookForm = ({
  bookId,
  initialData,
  userRole,
  storeId,
}: BookEditFormProps) => {
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

  const {
    handleUpload: handleImageUpload,
    isUploading: isUploadingImage,
    selectedFile,
  } = useImageUpload({
    folder: 'book-covers',
    successMessage: 'Image uploadée avec succès!',
    onSuccess: (url) => {
      setBookData((prev) => ({
        ...prev,
        coverImage: url,
      }));
      setSuccess('Image uploadée avec succès!');
    },
    onError: (error) => setError(error),
  });

  const [bookData, setBookData] = useState<BookFormData>({
    isbn: '',
    title: '',
    authors: '',
    publisher: '',
    publishedDate: '',
    description: '',
    coverImage: '',
    pageCount: '',
    genre: '',
    tone: '',
    ageGroup: '',
    purchaseLink: '',
    recommendation: '',
    assignedTo: [],
    sections: [],
  });

  const [isSearching, setIsSearching] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploadingCoverFromISBN, setIsUploadingCoverFromISBN] =
    useState(false);
  const [librarians, setLibrarians] = useState<any[]>([]);
  const [loadingLibrarians, setLoadingLibrarians] = useState(false);

  // Load existing book data if bookId is provided (for editing)
  useEffect(() => {
    if (bookId && initialData) {
      setIsLoading(true);

      // Use the initialData passed from the server
      setBookData(initialData);

      setIsLoading(false);
    }
  }, [bookId, initialData]);

  // Fetch librarians for assignment (only for StoreAdmin)
  useEffect(() => {
    if (userRole === 'storeAdmin' && storeId) {
      const fetchLibrarians = async () => {
        try {
          setLoadingLibrarians(true);
          // Fetch users from the same store with librarian role
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
    setBookData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    // Clear general error when user modifies form
    if (error) {
      setError('');
    }
  };

  const handleISBNSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and success messages
    setError('');
    setSuccess('');
    setValidationErrors([]);

    if (!bookData.isbn.trim()) {
      setError('Veuillez saisir un ISBN');
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/isbn/${bookData.isbn}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch book data');
      }

      const book = data.book;
      const coverUrl = book.image || book.image_original || '';

      // Auto-populate form with API response
      setBookData((prev) => ({
        ...prev,
        title: book.title || book.title_long || '',
        authors: Array.isArray(book.authors) ? book.authors.join(', ') : '',
        publisher: book.publisher || '',
        publishedDate: book.date_published || '',
        description: book.synopsis || book.overview || '',
        coverImage: coverUrl,
        pageCount: book.pages ? book.pages.toString() : '',
      }));

      // If we got a cover URL, upload it to Cloudinary
      if (coverUrl) {
        try {
          setIsUploadingCoverFromISBN(true);
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: coverUrl }),
          });

          const uploadData = await uploadResponse.json();

          if (uploadResponse.ok) {
            setBookData((prev) => ({
              ...prev,
              coverImage: uploadData.url,
            }));
            setSuccess(
              'Informations du livre et couverture récupérées avec succès!'
            );
          } else {
            setSuccess(
              'Informations du livre récupérées (couverture non uploadée)'
            );
          }
        } catch (uploadError) {
          console.error('Error uploading cover to Cloudinary:', uploadError);
          setSuccess(
            'Informations du livre récupérées (couverture non uploadée)'
          );
        } finally {
          setIsUploadingCoverFromISBN(false);
        }
      } else {
        setSuccess('Informations du livre récupérées avec succès!');
      }
    } catch (error) {
      console.error('Error searching ISBN:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la recherche ISBN'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const resetForm = () => {
    setBookData({
      isbn: '',
      title: '',
      authors: '',
      publisher: '',
      publishedDate: '',
      description: '',
      coverImage: '',
      pageCount: '',
      genre: '',
      tone: '',
      ageGroup: '',
      purchaseLink: '',
      recommendation: '',
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
    const requiredFields = [
      'isbn',
      'title',
      'authors',
      'publisher',
      'description',
      'genre',
      'tone',
    ];
    // Check for required fields
    const missingFields = requiredFields.filter((field) => {
      const value = bookData[field as keyof BookFormData];
      // Handle string fields (trim) vs array fields (check length)
      if (typeof value === 'string') {
        return !value.trim();
      } else if (Array.isArray(value)) {
        return false; // Arrays are optional and empty is valid
      }
      return !value;
    });
    if (missingFields.length > 0) {
      const fieldLabels: { [key: string]: string } = {
        isbn: 'ISBN',
        title: 'Titre',
        authors: 'Auteur(s)',
        publisher: "Maison d'édition",
        description: 'Description',
        genre: 'Genre',
        tone: 'Ton',
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
      const isEditing = !!bookId;

      // Prepare the payload for the API
      const payload = {
        isbn: bookData.isbn.trim(),
        title: bookData.title.trim(),
        authors: bookData.authors.split(',').map((author) => author.trim()),
        cover: bookData.coverImage || undefined,
        description: bookData.description.trim(),
        publisher: bookData.publisher.trim(),
        pageCount: bookData.pageCount
          ? parseInt(bookData.pageCount)
          : undefined,
        publishDate: bookData.publishedDate || undefined,
        genre: bookData.genre,
        tone: bookData.tone,
        ageGroup: bookData.ageGroup || undefined,
        purchaseLink: bookData.purchaseLink || undefined,
        recommendation: bookData.recommendation || undefined,
        // Include assignment fields if user is StoreAdmin
        ...(userRole === 'storeAdmin' && {
          assignedTo: bookData.assignedTo || [],
          sections: bookData.sections || [],
        }),
      };

      if (isEditing) {
        // Update existing book
        const response = await fetch(`/api/books/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update book');
        }

        setSuccess('Livre modifié avec succès!');
      } else {
        // Create new book
        const response = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create book');
        }

        // Show success toast
        toast.success(`Livre "${data.book.title}" ajouté avec succès`);

        // Wait a moment for user to see the success state
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Redirect to books list
        router.push('/dashboard/books');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving book:', error);
      const isEditing = !!bookId;
      setError(
        error instanceof Error
          ? error.message
          : isEditing
          ? 'Erreur lors de la modification du livre'
          : "Erreur lors de l'ajout du livre"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state when loading existing book data
  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='loading loading-spinner loading-lg'></div>
        <span className='ml-4'>Chargement des données du livre...</span>
      </div>
    );
  }

  const isEditing = !!bookId;

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-[-16px] flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-stretch'
    >
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border px-6 py-2 flex-1 flex flex-col items-center'>
        {/* Error and Success Messages */}
        <FormAlerts
          error={error}
          success={success}
          validationErrors={validationErrors}
          variant='compact'
          className='w-full'
        />

        <legend className='fieldset-legend'>
          {isEditing ? 'Modifier le livre' : 'Détails du livre'}
        </legend>

        <label className='label w-full max-w-md text-center'>EAN/ISBN *</label>
        <div className='relative w-full max-w-md mx-auto'>
          <input
            type='text'
            name='isbn'
            value={bookData.isbn}
            onChange={handleInputChange}
            className='input w-full pr-32'
            placeholder='9782123456789'
            maxLength={17}
            disabled={isEditing}
          />
          <button
            type='button'
            onClick={handleISBNSearch}
            disabled={isSearching || isEditing}
            className='isbn-search-btn'
          >
            {isSearching ? (
              <span className='loading loading-spinner loading-xs'></span>
            ) : (
              <>
                <FaSearch className='w-3 h-3' />
                <span className='ml-1 text-xs'>Rechercher</span>
              </>
            )}
          </button>
        </div>

        <label className='label w-full max-w-md text-center'>Titre *</label>
        <input
          type='text'
          name='title'
          value={bookData.title}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder='Saisissez le titre du livre'
        />

        <label className='label w-full max-w-md text-center'>Auteur(s) *</label>
        <input
          type='text'
          name='authors'
          value={bookData.authors}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder='Saisissez le ou les auteur(s) du livre'
        />

        <label className='label w-full max-w-md text-center'>
          Maison d'édition *
        </label>
        <input
          type='text'
          name='publisher'
          value={bookData.publisher}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder="Saisissez la maison d'édition"
        />

        <label className='label w-full max-w-md text-center'>
          Nombre de pages
        </label>
        <input
          type='number'
          name='pageCount'
          value={bookData.pageCount}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder='Nombre de pages'
          min='1'
        />

        <label className='label w-full max-w-md text-center'>
          Date de publication *
        </label>
        <input
          type='date'
          name='publishedDate'
          value={bookData.publishedDate}
          onChange={handleInputChange}
          className='input w-full max-w-md'
        />

        <label className='label w-full max-w-md text-center'>
          Description *
        </label>
        <textarea
          name='description'
          value={bookData.description}
          onChange={handleInputChange}
          className='textarea w-full max-w-md'
          placeholder='Ajoutez le résumé officiel du livre'
          rows={4}
        />

        <label className='label w-full max-w-md text-center'>Couverture</label>
        <div className='flex items-center gap-4 w-full max-w-md'>
          <div className='relative'>
            <img
              src={bookData.coverImage || '/placeholder-book-cover.jpg'}
              alt='Couverture du livre'
              className='w-[121px] h-[170px] object-cover border border-base-300 rounded cursor-pointer hover:scale-105 transition-all duration-200'
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
            onChange={handleImageUpload}
            disabled={isUploadingImage || isLoading}
          />
        </div>
      </fieldset>

      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border px-6 pt-2 pb-6 flex-1 flex flex-col items-center'>
        <legend className='fieldset-legend'>
          Informations complémentaires
        </legend>

        <label className='label w-full max-w-md text-center'>Genre *</label>
        <select
          name='genre'
          value={bookData.genre}
          onChange={handleInputChange}
          className='select w-full max-w-md cursor-pointer'
        >
          <option value=''>Sélectionnez un genre</option>
          {genres.map((genre) => (
            <option
              key={genre.value}
              value={genre.value}
              title={genre.description}
            >
              {genre.label}
            </option>
          ))}
        </select>

        <label className='label w-full max-w-md text-center'>Ton *</label>
        <select
          name='tone'
          value={bookData.tone}
          onChange={handleInputChange}
          className='select w-full max-w-md cursor-pointer'
        >
          <option value=''>Sélectionnez un ton</option>
          {tones.map((tone) => (
            <option
              key={tone.value}
              value={tone.value}
              title={tone.description}
            >
              {tone.label}
            </option>
          ))}
        </select>

        <label className='label w-full max-w-md text-center'>
          Tranche d'âge
        </label>
        <select
          name='ageGroup'
          value={bookData.ageGroup}
          onChange={handleInputChange}
          className='select w-full max-w-md cursor-pointer'
        >
          <option value=''>Sélectionnez une tranche d'âge</option>
          {ageGroups.map((ageGroup) => (
            <option
              key={ageGroup.value}
              value={ageGroup.value}
              title={ageGroup.description}
            >
              {ageGroup.label}
            </option>
          ))}
        </select>

        <label className='label w-full max-w-md text-center'>
          Lien d'achat
        </label>
        <input
          type='url'
          name='purchaseLink'
          value={bookData.purchaseLink}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder='https://www.example.com/...'
        />

        <label className='label w-full max-w-md text-center'>
          Recommandation
        </label>
        <textarea
          name='recommendation'
          value={bookData.recommendation}
          onChange={handleInputChange}
          className='textarea w-full max-w-md'
          placeholder='Votre recommandation personnelle pour ce livre...'
          rows={4}
        />

        {/* Assignment fields - Only visible for StoreAdmin */}
        {userRole === 'storeAdmin' && (
          <AssignmentFields
            librarians={librarians}
            loadingLibrarians={loadingLibrarians}
            assignedTo={bookData.assignedTo}
            onAssignedToChange={(ids) =>
              setBookData({ ...bookData, assignedTo: ids })
            }
            sections={bookData.sections}
            onSectionsChange={(sections) =>
              setBookData({ ...bookData, sections })
            }
          />
        )}

        {/* Spacer to push buttons to bottom */}
        <div className='flex-grow'></div>

        <div className='flex gap-4 mt-6 w-full max-w-md'>
          <button
            type='button'
            className={`btn btn-soft dark:btn-secondary flex-1 ${
              isEditing ? 'hidden' : 'block'
            }`}
            onClick={resetForm}
            disabled={isLoading}
          >
            Effacer
          </button>
          <button
            type='submit'
            className='btn btn-soft btn-primary flex-1'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className='loading loading-spinner loading-sm'></span>
                {isEditing ? 'Modification...' : 'Ajout...'}
              </>
            ) : (
              <>{isEditing ? 'Modifier le livre' : 'Ajouter le livre'}</>
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
};

export default BookForm;
