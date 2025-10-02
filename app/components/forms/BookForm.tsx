'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import {
  HiExclamationCircle,
  HiCheckCircle,
  HiExclamation,
} from 'react-icons/hi';
import { genres, tones, ageGroups } from '@/app/lib/facets';
import { redirect } from 'next/navigation';
import booksData from '@/app/lib/mock/books.json';

interface BookData {
  isbn: string;
  title: string;
  authors: string;
  publisher: string;
  publishedDate: string;
  description: string;
  coverImage: string;
  pageCount: string;
  genre: string;
  tone: string;
  ageGroup: string;
  purchaseLink: string;
  recommendation: string;
}

interface BookEditFormProps {
  bookIsbn?: string; // Optional prop for editing existing books
}

const BookForm = ({ bookIsbn }: BookEditFormProps) => {
  const [bookData, setBookData] = useState<BookData>({
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

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load existing book data if bookIsbn is provided (for editing)
  useEffect(() => {
    if (bookIsbn) {
      setIsLoading(true);

      // Find the book by ISBN from mock data
      const existingBook = booksData.find((book) => book.isbn === bookIsbn);

      if (existingBook) {
        setBookData({
          isbn: existingBook.isbn,
          title: existingBook.bookData.title,
          authors: existingBook.bookData.authors.join(', '),
          publisher: existingBook.bookData.publisher,
          publishedDate: existingBook.bookData.publishDate
            ? existingBook.bookData.publishDate.split('T')[0]
            : '', // Convert to YYYY-MM-DD format
          description: existingBook.bookData.description,
          coverImage: existingBook.bookData.cover,
          pageCount: existingBook.bookData.pageCount?.toString() || '',
          genre: existingBook.genre,
          tone: existingBook.tone,
          ageGroup: existingBook.ageGroup,
          purchaseLink: existingBook.purchaseLink,
          recommendation: existingBook.recommendation,
        });
      } else {
        setError(`Aucun livre trouvé avec l'ISBN: ${bookIsbn}`);
      }

      setIsLoading(false);
    }
  }, [bookIsbn]);

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
          setIsUploadingImage(true);
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
          setIsUploadingImage(false);
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

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Update the cover image URL with Cloudinary URL
      setBookData((prev) => ({
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
    const requiredFields = [
      'isbn',
      'title',
      'authors',
      'publisher',
      'description',
      'genre',
      'tone',
    ];
    const missingFields = requiredFields.filter(
      (field) => !bookData[field as keyof BookData]?.trim()
    );

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
      const isEditing = !!bookIsbn;

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
      };

      if (isEditing) {
        // TODO: Implement PUT request for editing
        // const response = await fetch(`/api/books/${bookIsbn}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload),
        // });
        console.log('Edit book payload:', payload);
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

        setSuccess('Livre ajouté avec succès!');

        // Reset form after successful submission
        setTimeout(() => {
          resetForm();
        }, 1500);
      }

      // Redirect to books page after a short delay to show success message
      setTimeout(() => {
        window.location.href = '/dashboard/books';
      }, 2000);
    } catch (error) {
      console.error('Error saving book:', error);
      const isEditing = !!bookIsbn;
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

  const isEditing = !!bookIsbn;

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-[-16px] flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-stretch'
    >
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border px-6 py-2 flex-1 flex flex-col items-center'>
        {/* Error and Success Messages */}
        {(error || success || validationErrors.length > 0) && (
          <div className='w-full'>
            {error && (
              <div className='alert alert-error alert-soft mb-1 shadow-sm'>
                <HiExclamationCircle className='size-5 shrink-0 stroke-current' />
                <span className='text-sm font-medium'>{error}</span>
              </div>
            )}

            {success && (
              <div className='alert alert-success alert-soft mb-1 shadow-sm'>
                <HiCheckCircle className='size-5 shrink-0 stroke-current' />
                <span className='text-sm font-medium'>{success}</span>
              </div>
            )}
          </div>
        )}
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
            onChange={handleFileChange}
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
          rows={8}
        />

        {validationErrors.length > 0 && (
          <div className='alert alert-warning alert-soft mt-4 shadow-sm'>
            <HiExclamation className='size-5 shrink-0 stroke-current' />
            <div className='text-sm font-medium'>
              {validationErrors.map((validationError, index) => (
                <div key={index}>{validationError}</div>
              ))}
            </div>
          </div>
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
