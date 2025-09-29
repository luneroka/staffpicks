/**
 * Visibility utility functions and configurations
 */

export type VisibilityType = 'public' | 'unlisted' | 'private' | string;

export interface VisibilityConfig {
  label: string;
  badgeClass: string;
}

/**
 * Configuration mapping for different visibility types
 */
const VISIBILITY_CONFIG: Record<string, VisibilityConfig> = {
  public: {
    label: 'Publiée',
    badgeClass: 'badge-success',
  },
  unlisted: {
    label: 'Non publiée',
    badgeClass: 'badge-error',
  },
  private: {
    label: 'Brouillon',
    badgeClass: 'badge-warning',
  },
};

/**
 * Gets the visibility configuration for a given visibility type
 * @param visibility - The visibility type string
 * @returns Configuration object with label and badge class
 */
export const getVisibilityConfig = (
  visibility: VisibilityType | undefined
): VisibilityConfig | null => {
  if (!visibility) return null;

  return (
    VISIBILITY_CONFIG[visibility] || {
      label: 'Brouillon',
      badgeClass: 'badge-warning',
    }
  );
};
