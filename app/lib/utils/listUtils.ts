/**
 * List utility functions
 */

// Default cover image for lists without a custom cover
const DEFAULT_LIST_COVER =
  'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075480/rentr%C3%A9e_litt%C3%A9raire_ac1clu.png';

/**
 * Transform MongoDB list document to client-safe list data
 * Handles all List model fields including populated references
 * Works with both populated and unpopulated items
 */
export function transformListForClient(list: any) {
  return {
    id: list._id.toString(),
    title: list.title,
    slug: list.slug,
    description: list.description || '',
    coverImage: list.coverImage || DEFAULT_LIST_COVER,
    visibility: list.visibility,
    publishAt: list.publishAt,
    unpublishAt: list.unpublishAt,
    // Items - handles both populated (with bookData) and unpopulated (just ID)
    items: (list.items || [])
      .filter((item: any) => item.bookId !== null) // Filter out books that couldn't be populated
      .map((item: any) => {
        const bookId =
          item.bookId?._id?.toString() ||
          item.bookId?.toString() ||
          item.bookId;

        // If items are populated with book data, include all book fields
        if (item.bookId?.bookData) {
          return {
            bookId,
            isbn: item.bookId.isbn,
            title: item.bookId.bookData.title,
            authors: item.bookId.bookData.authors,
            cover: item.bookId.bookData.cover,
            genre: item.bookId.genre,
            tone: item.bookId.tone,
            ageGroup: item.bookId.ageGroup,
            position: item.position,
            addedAt: item.addedAt,
          };
        }

        // Otherwise just return minimal item data
        return {
          bookId,
          position: item.position,
          addedAt: item.addedAt,
        };
      }),
    // Assignment and sections
    assignedTo: (list.assignedTo || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    ),
    sections: list.sections || [],
    // References (may be populated)
    companyId: list.companyId?._id?.toString() || list.companyId?.toString(),
    storeId: list.storeId?._id?.toString() || list.storeId?.toString(),
    storeName: list.storeId?.name,
    ownerUserId:
      list.ownerUserId?._id?.toString() || list.ownerUserId?.toString(),
    owner:
      list.ownerUserId &&
      list.ownerUserId.firstName &&
      list.ownerUserId.lastName &&
      list.ownerUserId.email
        ? {
            name: `${list.ownerUserId.firstName} ${list.ownerUserId.lastName}`,
            email: list.ownerUserId.email,
          }
        : undefined,
    createdBy:
      list.createdBy &&
      list.createdBy.firstName &&
      list.createdBy.lastName &&
      list.createdBy.email
        ? {
            name: `${list.createdBy.firstName} ${list.createdBy.lastName}`,
            email: list.createdBy.email,
          }
        : undefined,
    // Timestamps
    createdAt: list.createdAt?.toISOString?.() || list.createdAt,
    updatedAt: list.updatedAt?.toISOString?.() || list.updatedAt,
    deletedAt: list.deletedAt?.toISOString?.() || list.deletedAt,
  };
}

/**
 * Transform MongoDB list document to minimal display data (for cards/carousels)
 * Only includes essential fields for List component display
 */
export function transformListForDisplay(list: any) {
  return {
    id: list._id.toString(),
    title: list.title,
    slug: list.slug,
    description: list.description || '',
    coverUrl: list.coverImage || DEFAULT_LIST_COVER,
    visibility: list.visibility,
    itemCount: list.items?.length || 0,
    updatedAt: list.updatedAt,
  };
}

/**
 * Transform MongoDB list document for ListCard component
 * Includes fields needed for list cards in dashboard
 */
export function transformListForCard(list: any) {
  return {
    _id: list._id.toString(),
    coverImage: list.coverImage || DEFAULT_LIST_COVER,
    title: list.title,
    visibility: list.visibility,
    items: (list.items || [])
      .filter((item: any) => item.bookId !== null) // Filter out books that couldn't be populated
      .map((item: any) => ({
        bookId: item.bookId?.toString() || item.bookId,
        position: item.position,
        addedAt: item.addedAt,
      })),
    createdBy: list.createdBy
      ? {
          _id: list.createdBy._id?.toString(),
          firstName: list.createdBy.firstName,
          lastName: list.createdBy.lastName,
          email: list.createdBy.email,
        }
      : null,
    updatedAt: list.updatedAt,
  };
}

/**
 * Gets the count of books in a list
 */
export function getListBookCount(list: { items?: Array<any> }): number {
  return list.items?.length || 0;
}

/**
 * Checks if a list is published (public and not deleted)
 */
export function isListPublished(list: {
  visibility: string;
  deletedAt?: any;
}): boolean {
  return list.visibility === 'public' && !list.deletedAt;
}
