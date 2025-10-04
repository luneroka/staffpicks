/**
 * List-related type definitions
 * Centralized types for List entities across the application
 */

import { UserReference } from './book';

/**
 * List item reference (book in a list)
 */
export interface ListItemMinimal {
  bookId: string;
  position: number;
  addedAt: string | Date;
}

/**
 * List item with full book data (populated)
 */
export interface ListItem {
  bookId: string;
  isbn: string;
  title: string;
  authors: string[];
  cover?: string;
  genre?: string;
  tone?: string;
  ageGroup?: string;
  position: number;
  addedAt?: Date;
}

/**
 * Complete List entity (matches MongoDB List model)
 */
export interface List {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  visibility: string;
  publishAt?: string | Date;
  unpublishAt?: string | Date;
  items: ListItemMinimal[] | ListItem[];
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
 * List for card display
 * Structure matching ListCard component requirements
 */
export interface ListCard {
  _id: string; // Note: uses _id not id for legacy component compatibility
  coverImage: string;
  title?: string;
  visibility?: string;
  items?: ListItemMinimal[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  updatedAt?: Date | string;
}

/**
 * List for display (simple cards/carousels)
 */
export interface ListDisplay {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl: string;
  visibility: string;
  itemCount: number;
  updatedAt?: Date | string;
}

/**
 * List for detail view
 * Structure with populated items
 */
export interface ListDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  visibility: string;
  publishAt?: Date;
  unpublishAt?: Date;
  items: ListItem[];
  owner?: {
    name: string;
    email: string;
  };
  createdBy?: {
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
 * List form data (for create/edit forms)
 */
export interface ListFormData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  visibility: string;
  publishAt?: string;
  unpublishAt?: string;
  items: {
    bookId: string;
    position: number;
  }[];
  assignedTo?: string[];
  sections?: string[];
}
