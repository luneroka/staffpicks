/**
 * Book utility functions
 */

import {
  getGenreByValue,
  getToneByValue,
  getAgeGroupByValue,
} from '@/app/lib/facets';

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

/**
 * Transform MongoDB book document to client-safe book data
 * Handles all Book model fields including populated references
 */
export function transformBookForClient(book: any) {
  return {
    id: book._id.toString(),
    isbn: book.isbn,
    title: book.bookData.title,
    authors: book.bookData.authors,
    cover: book.bookData.cover || '/placeholder-book-cover.jpg',
    description: book.bookData.description,
    publisher: book.bookData.publisher,
    pageCount: book.bookData.pageCount,
    publishDate: book.bookData.publishDate,
    genre: book.genre,
    tone: book.tone,
    ageGroup: book.ageGroup,
    purchaseLink: book.purchaseLink,
    recommendation: book.recommendation,
    // Assignment and sections
    assignedTo: (book.assignedTo || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    ),
    sections: book.sections || [],
    // References (may be populated)
    companyId: book.companyId?._id?.toString() || book.companyId?.toString(),
    storeId: book.storeId?._id?.toString() || book.storeId?.toString(),
    storeName: book.storeId?.name,
    ownerUserId:
      book.ownerUserId?._id?.toString() || book.ownerUserId?.toString(),
    owner:
      book.ownerUserId &&
      book.ownerUserId.firstName &&
      book.ownerUserId.lastName &&
      book.ownerUserId.email
        ? {
            name: `${book.ownerUserId.firstName} ${book.ownerUserId.lastName}`,
            email: book.ownerUserId.email,
          }
        : undefined,
    createdBy:
      book.createdBy &&
      book.createdBy.firstName &&
      book.createdBy.lastName &&
      book.createdBy.email
        ? {
            _id: book.createdBy._id?.toString() || book.createdBy?.toString?.(),
            name: `${book.createdBy.firstName} ${book.createdBy.lastName}`,
            email: book.createdBy.email,
          }
        : undefined,
    // Timestamps
    createdAt: book.createdAt?.toISOString?.() || book.createdAt,
    updatedAt: book.updatedAt?.toISOString?.() || book.updatedAt,
  };
}

/**
 * Transform MongoDB book document to minimal display data (for cards/list views)
 * Includes fields needed for Book component and grouping/filtering in list views
 */
export function transformBookForDisplay(book: any) {
  return {
    id: book._id.toString(),
    isbn: book.isbn,
    title: book.bookData.title,
    cover: book.bookData.cover,
    authors: book.bookData.authors,
    genre: book.genre,
    // Store info (for CompanyAdmin grouping)
    storeId: book.storeId?._id?.toString() || book.storeId?.toString(),
    storeName: book.storeId?.name,
    // Creator info (for StoreAdmin grouping)
    createdBy: book.createdBy
      ? {
          _id: book.createdBy._id?.toString() || book.createdBy?.toString?.(),
          firstName: book.createdBy.firstName,
          lastName: book.createdBy.lastName,
        }
      : undefined,
    // Assigned users info (for StoreAdmin grouping)
    assignedTo: book.assignedTo
      ? book.assignedTo
          .filter((user: any) => user && user._id) // Only include populated users
          .map((user: any) => ({
            _id: user._id?.toString() || user?.toString?.(),
            firstName: user.firstName,
            lastName: user.lastName,
          }))
      : [],
  };
}
