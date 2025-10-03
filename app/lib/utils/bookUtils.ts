/**
 * Book utility functions
 */

import {
  getGenreByValue,
  getToneByValue,
  getAgeGroupByValue,
} from '@/app/lib/facets';

interface BookData {
  _id: string;
  isbn: string;
  bookData: {
    title: string;
    cover: string;
    authors: string[];
    publisher: string;
    description: string;
    pageCount: number;
    publishDate: string;
  };
  genre: string;
  tone: string;
  ageGroup: string;
  purchaseLink: string;
  recommendation: string;
}

interface BookComponentProps {
  coverUrl: string;
  isbn: string;
  title: string;
}

/**
 * Extracts and sanitizes book data for the Book component
 * This function prepares data for future API integration
 */
export function extractBookProps(book: BookData): BookComponentProps {
  return {
    coverUrl: book.bookData.cover || '/placeholder-book-cover.jpg',
    isbn: book.isbn || '',
    title: book.bookData.title || 'Titre non disponible',
  };
}

/**
 * Finds a book by ID and returns sanitized props for Book component
 * Returns null if book not found
 */
export function findBookAndExtractProps(
  books: BookData[],
  bookId: string
): BookComponentProps | null {
  const book = books.find((book) => book._id === bookId);
  return book ? extractBookProps(book) : null;
}

/**
 * Get formatted genre label from stored value
 * Returns the properly formatted label with capitalization and accents
 */
export function getGenreLabel(value: string | undefined): string {
  if (!value) return '';
  const genre = getGenreByValue(value);
  return genre ? genre.label : value;
}

/**
 * Get formatted tone label from stored value
 * Returns the properly formatted label with capitalization and accents
 */
export function getToneLabel(value: string | undefined): string {
  if (!value) return '';
  const tone = getToneByValue(value);
  return tone ? tone.label : value;
}

/**
 * Get formatted age group label from stored value
 * Returns the properly formatted label with capitalization and accents
 */
export function getAgeGroupLabel(value: string | undefined): string {
  if (!value) return '';
  const ageGroup = getAgeGroupByValue(value);
  return ageGroup ? ageGroup.label : value;
}
