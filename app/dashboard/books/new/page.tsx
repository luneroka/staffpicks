'use client';

import React, { useState } from 'react';
import { FaUpload, FaSearch } from 'react-icons/fa';

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

const AddBook = () => {
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
  };

  const handleISBNSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookData.isbn.trim()) {
      alert('Veuillez saisir un ISBN');
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
        description: book.synopsis || book.overview || '', // API might have synopsis/overview
        coverImage: book.image || book.image_original || '',
      }));
    } catch (error) {
      console.error('Error searching ISBN:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la recherche ISBN'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      alert(
        `Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`
      );
      return;
    }

    try {
      console.log('Submitting book data:', bookData);
      // TODO: Add actual API call to save the book
      alert('Livre ajouté avec succès!');
    } catch (error) {
      console.error('Error saving book:', error);
      alert("Erreur lors de l'ajout du livre");
    }
  };

  return (
    <div className='mt-[-32px] flex items-start justify-center p-4 md:p-8'>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-stretch'
      >
        <fieldset className='fieldset bg-base-200 border-base-300 rounded-box border p-6 flex-1 flex flex-col items-center'>
          <legend className='fieldset-legend'>Détails du livre</legend>

          <label className='label w-full max-w-md text-center'>
            EAN/ISBN *
          </label>
          <div className='relative w-full max-w-md mx-auto'>
            <input
              type='text'
              name='isbn'
              value={bookData.isbn}
              onChange={handleInputChange}
              className='input w-full pr-32'
              placeholder='9782123456789'
              maxLength={17}
            />
            <button
              type='button'
              onClick={handleISBNSearch}
              disabled={isSearching}
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

          <label className='label w-full max-w-md text-center'>
            Auteur(s) *
          </label>
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

          <label className='label w-full max-w-md text-center'>
            Couverture
          </label>
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
            <option value='roman'>Roman</option>
            <option value='nouvelle'>Nouvelle</option>
            <option value='essai'>Essai</option>
            <option value='biographie'>Biographie</option>
            <option value='histoire'>Histoire</option>
            <option value='science-fiction'>Science-fiction</option>
            <option value='fantasy'>Fantasy</option>
            <option value='thriller'>Thriller</option>
            <option value='policier'>Policier</option>
            <option value='romance'>Romance</option>
            <option value='jeunesse'>Jeunesse</option>
            <option value='bande-dessinee'>Bande dessinée</option>
            <option value='poesie'>Poésie</option>
            <option value='theatre'>Théâtre</option>
            <option value='autre'>Autre</option>
          </select>

          <label className='label w-full max-w-md text-center'>Ton *</label>
          <select
            name='tone'
            value={bookData.tone}
            onChange={handleInputChange}
            className='select w-full max-w-md'
          >
            <option value=''>Sélectionnez un ton</option>
            <option value='leger'>Léger</option>
            <option value='serieux'>Sérieux</option>
            <option value='humoristique'>Humoristique</option>
            <option value='dramatique'>Dramatique</option>
            <option value='melancolique'>Mélancolique</option>
            <option value='optimiste'>Optimiste</option>
            <option value='sombre'>Sombre</option>
            <option value='poetique'>Poétique</option>
            <option value='satirique'>Satirique</option>
            <option value='contemplatif'>Contemplatif</option>
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
            <option value='enfant'>Enfant (0-12 ans)</option>
            <option value='adolescent'>Adolescent (13-17 ans)</option>
            <option value='jeune-adulte'>Jeune adulte (18-25 ans)</option>
            <option value='adulte'>Adulte (26+ ans)</option>
            <option value='tout-public'>Tout public</option>
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

          {/* Spacer to push buttons to bottom */}
          <div className='flex-grow'></div>

          <div className='flex gap-4 mt-6 w-full max-w-md'>
            <button type='button' className='btn btn-outline flex-1'>
              Annuler
            </button>
            <button
              type='submit'
              className='btn bg-primary-theme hover:bg-secondary-accent hover:text-white flex-1'
            >
              Ajouter le livre
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default AddBook;
