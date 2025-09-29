'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { CiCircleCheck, CiCircleRemove, CiWarning } from 'react-icons/ci';
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
  genre: string;
  tone: string;
  ageGroup: string;
  fnacLink: string;
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
    genre: '',
    tone: '',
    ageGroup: '',
    fnacLink: '',
    recommendation: '',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
          genre: existingBook.genre,
          tone: existingBook.tone,
          ageGroup: existingBook.ageGroup,
          fnacLink: existingBook.fnacLink,
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

      // Auto-populate form with API response
      setBookData((prev) => ({
        ...prev,
        title: book.title || book.title_long || '',
        authors: Array.isArray(book.authors) ? book.authors.join(', ') : '',
        publisher: book.publisher || '',
        publishedDate: book.date_published || '',
        description: book.synopsis || book.overview || '',
        coverImage: book.image || book.image_original || '',
      }));

      setSuccess('Informations du livre récupérées avec succès!');
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
      genre: '',
      tone: '',
      ageGroup: '',
      fnacLink: '',
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

    try {
      console.log('Submitting book data:', bookData);
      // TODO: Add actual API call to save/update the book
      const isEditing = !!bookIsbn;
      setSuccess(
        isEditing ? 'Livre modifié avec succès!' : 'Livre ajouté avec succès!'
      );

      // Reset form after successful submission (only for new books)
      if (!isEditing) {
        resetForm();
      }
      redirect('/dashboard/books');
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
      className='flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-stretch'
    >
      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border p-6 flex-1 flex flex-col items-center'>
        {/* Error and Success Messages */}
        {(error || success || validationErrors.length > 0) && (
          <div className='w-full'>
            {error && (
              <div className='alert alert-error alert-soft mb-1 shadow-sm'>
                <CiCircleRemove className='size-5' />

                <span className='text-sm font-medium'>{error}</span>
              </div>
            )}

            {success && (
              <div className='alert alert-success alert-soft mb-1 shadow-sm'>
                <CiCircleCheck className='size-5' />
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
          <img
            src={bookData.coverImage || '/placeholder-book-cover.jpg'}
            alt='Couverture du livre'
            className='w-[121px] h-[170px] object-cover border border-base-300 rounded cursor-pointer hover:scale-105 transition-all duration-200'
          />
          <input type='file' className='file-input file-input-ghost' />
        </div>
      </fieldset>

      <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border p-6 flex-1 flex flex-col items-center'>
        <legend className='fieldset-legend'>
          Informations complémentaires
        </legend>

        <label className='label w-full max-w-md text-center'>Genre *</label>
        <select
          name='genre'
          value={bookData.genre}
          onChange={handleInputChange}
          className='select w-full max-w-md'
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
          className='select w-full max-w-md'
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
          className='select w-full max-w-md'
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

        <label className='label w-full max-w-md text-center'>Lien FNAC</label>
        <input
          type='url'
          name='fnacLink'
          value={bookData.fnacLink}
          onChange={handleInputChange}
          className='input w-full max-w-md'
          placeholder='https://www.fnac.com/...'
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
            <CiWarning className='size-5' />
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
            className='btn btn-outline flex-1'
            onClick={resetForm}
          >
            Annuler
          </button>
          <button
            type='submit'
            className='btn bg-primary-theme hover:bg-secondary-accent hover:text-white flex-1'
          >
            {isEditing ? 'Modifier le livre' : 'Ajouter le livre'}
          </button>
        </div>
      </fieldset>
    </form>
  );
};

export default BookForm;
