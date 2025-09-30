/**
 * List utility functions
 */

interface ListData {
  _id: string;
  ownerUserId: string;
  createdBy: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  visibility: string;
  publishAt?: string;
  unpublishAt?: string;
  items: Array<{
    bookId: string;
    position: number;
    addedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ListComponentProps {
  coverUrl: string;
  id: string;
  title: string;
  description: string;
}

/**
 * Extracts and sanitizes list data for the List component
 * This function prepares data for future API integration
 */
export function extractListProps(list: ListData): ListComponentProps {
  return {
    coverUrl: list.coverImage || '/placeholder-list-cover.jpg',
    id: list._id || '',
    title: list.title || 'Titre non disponible',
    description: list.description || 'Aucune description disponible',
  };
}

/**
 * Finds a list by ID and returns sanitized props for List component
 * Returns null if list not found
 */
export function findListAndExtractProps(
  lists: ListData[],
  listId: string
): ListComponentProps | null {
  const list = lists.find((list) => list._id === listId);
  return list ? extractListProps(list) : null;
}

/**
 * Gets the count of books in a list
 */
export function getListBookCount(list: { items?: Array<any> }): number {
  return list.items?.length || 0;
}

/**
 * Checks if a list is published (public and has publishAt date)
 */
export function isListPublished(list: ListData): boolean {
  return list.visibility === 'public' && !!list.publishAt;
}

/**
 * Gets display-friendly visibility label
 */
export function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case 'draft':
      return 'Brouillon';
    case 'unlisted':
      return 'Non listée';
    case 'public':
      return 'Publique';
    default:
      return 'Inconnu';
  }
}

/**
 * Filters lists by visibility status
 */
export function filterListsByVisibility(
  lists: ListData[],
  visibility: string
): ListData[] {
  return lists.filter((list) => list.visibility === visibility);
}

/**
 * Gets all published lists (public and with publishAt date)
 */
export function getPublishedLists(lists: ListData[]): ListData[] {
  return lists.filter((list) => isListPublished(list));
}

/**
 * Sorts lists by creation date (newest first)
 */
export function sortListsByDate(lists: ListData[]): ListData[] {
  return [...lists].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Sorts lists by update date (most recently updated first)
 */
export function sortListsByUpdateDate(lists: ListData[]): ListData[] {
  return [...lists].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Searches lists by title or description
 */
export function searchLists(lists: ListData[], query: string): ListData[] {
  if (!query.trim()) return lists;

  const searchTerm = query.toLowerCase();
  return lists.filter(
    (list) =>
      list.title.toLowerCase().includes(searchTerm) ||
      (list.description && list.description.toLowerCase().includes(searchTerm))
  );
}
