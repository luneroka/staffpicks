/**
 * Book-related type definitions
 * Centralized types for Book entities across the application
 */

/**
 * Basic user reference (for createdBy, owner, etc.)
 */
export interface UserReference {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Core book data structure from external API (ISBN DB, etc.)
 */
export interface BookData {
  title: string;
  authors: string[];
  publisher?: string;
  publishDate?: string | Date;
  description?: string;
  cover?: string;
  pageCount?: number;
}

/**
 * Complete Book entity (matches MongoDB Book model)
 * Used for detail views and full data access
 */
export interface Book {
  id: string;
  isbn: string;
  bookData: BookData;
  genre?: string;
  tone?: string;
  ageGroup?: string;
  purchaseLink?: string;
  recommendation?: string;
  // References
  companyId?: string;
  storeId?: string;
  storeName?: string;
  ownerUserId?: string;
  owner?: UserReference;
  createdBy?: UserReference;
  // Assignment & organization
  assignedTo?: string[];
  sections?: string[];
  // Timestamps
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;
}

/**
 * Flattened Book for display (cards, lists)
 * Simplified structure with commonly used fields at top level
 */
export interface BookDisplay {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  cover?: string;
  genre?: string;
  // Store info (for grouping)
  storeId?: string;
  storeName?: string;
  // Creator info (for grouping)
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  // Assigned users info (for StoreAdmin grouping)
  assignedTo?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
}

/**
 * Book for detail view
 * Flattened structure with all fields at top level for easier component access
 */
export interface BookDetail {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  cover?: string;
  description?: string;
  publisher?: string;
  pageCount?: number;
  publishDate?: Date;
  genre?: string;
  tone?: string;
  ageGroup?: string;
  purchaseLink?: string;
  recommendation?: string;
  owner?: {
    name: string;
    email: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  storeId?: string;
  storeName?: string;
  assignedTo?: string[];
  sections?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Book form data (for create/edit forms)
 * All fields as strings for form inputs
 */
export interface BookFormData {
  id?: string;
  isbn: string;
  title: string;
  authors: string; // Comma-separated string for text input
  publisher: string;
  publishedDate: string; // YYYY-MM-DD format for date input
  description: string;
  coverImage: string;
  pageCount: string; // String for number input
  genre: string;
  tone: string;
  ageGroup: string;
  purchaseLink: string;
  recommendation: string;
  assignedTo?: string[];
  sections?: string[];
}
