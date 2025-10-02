/**
 * User role types - re-exported for use in client components
 * This avoids importing the full User model which has server-side dependencies (bcrypt)
 *
 * Note: This is a duplicate of the enum in User.ts to avoid circular dependencies
 * and server-side imports in client components. Keep both in sync!
 */
export enum UserRole {
  Admin = 'admin', // Platform admin (manages all companies and users)
  CompanyAdmin = 'companyAdmin', // Company admin (sets up company + can add store admins and librarians)
  StoreAdmin = 'storeAdmin', // Store admin (can manage their librarians within their store)
  Librarian = 'librarian', // Librarian (manages books and lists for their store)
}
