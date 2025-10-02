/**
 * User role types - extracted to avoid importing server-side dependencies in client components
 */
export enum UserRole {
  Admin = 'admin', // Platform admin (manages all companies and users)
  CompanyAdmin = 'companyAdmin', // Company admin (sets up company + can add store admins and librarians)
  StoreAdmin = 'storeAdmin', // Store admin (can manage their librarians within their store)
  Librarian = 'librarian', // Librarian (manages books and lists for their store)
}
