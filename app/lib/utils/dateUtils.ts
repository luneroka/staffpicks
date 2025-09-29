/**
 * Date utility functions for formatting and manipulation
 */

/**
 * Formats a date to DD/MM/YYYY format
 * @param date - Date object, string, or undefined
 * @returns Formatted date string or fallback message
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Non disponible';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return 'Date invalide';

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formats a date to DD/MM/YYYY HH:MM format
 * @param date - Date object, string, or undefined
 * @returns Formatted date and time string or fallback message
 */
export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return 'Non disponible';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return 'Date invalide';

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formats a date to a relative time string (e.g., "2 days ago")
 * @param date - Date object, string, or undefined
 * @returns Relative time string or fallback message
 */
export const formatRelativeTime = (date: Date | string | undefined): string => {
  if (!date) return 'Non disponible';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return 'Date invalide';

  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Aujourd'hui";
  if (diffInDays === 1) return 'Hier';
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
  if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
  return `Il y a ${Math.floor(diffInDays / 365)} ans`;
};
