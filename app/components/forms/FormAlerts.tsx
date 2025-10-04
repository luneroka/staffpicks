import React from 'react';
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiExclamation,
} from 'react-icons/hi';

export interface FormAlertsProps {
  /**
   * Error message to display
   */
  error?: string;

  /**
   * Success message to display
   */
  success?: string;

  /**
   * Array of validation error messages to display
   */
  validationErrors?: string[];

  /**
   * Style variant for the alerts
   * - 'standard': Regular size with text-xl icons (default)
   * - 'compact': Smaller with alert-soft styling
   */
  variant?: 'standard' | 'compact';

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for individual alerts
   */
  alertClassName?: string;
}

/**
 * Reusable component for displaying form error, success, and validation messages
 * Handles consistent styling and icon display across all forms
 *
 * @example Standard style
 * ```tsx
 * <FormAlerts
 *   error={error}
 *   success={success}
 * />
 * ```
 *
 * @example Compact style with validation errors
 * ```tsx
 * <FormAlerts
 *   error={error}
 *   success={success}
 *   validationErrors={validationErrors}
 *   variant="compact"
 *   className="w-full mb-4"
 * />
 * ```
 */
const FormAlerts: React.FC<FormAlertsProps> = ({
  error,
  success,
  validationErrors = [],
  variant = 'standard',
  className = '',
  alertClassName = '',
}) => {
  // Don't render anything if there are no messages
  if (!error && !success && validationErrors.length === 0) {
    return null;
  }

  const isCompact = variant === 'compact';

  // Icon size classes
  const iconClass = isCompact ? 'size-5 shrink-0 stroke-current' : 'text-xl';

  // Text size classes
  const textClass = isCompact ? 'text-sm font-medium' : '';

  // Alert style classes
  const baseAlertClass = isCompact ? 'alert-soft mb-1 shadow-sm' : '';

  return (
    <div className={className}>
      {/* Error Message */}
      {error && (
        <div
          className={`alert alert-error ${baseAlertClass} ${alertClassName}`}
        >
          <HiExclamationCircle className={iconClass} />
          <span className={textClass}>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          className={`alert alert-success ${baseAlertClass} ${alertClassName}`}
        >
          <HiCheckCircle className={iconClass} />
          <span className={textClass}>{success}</span>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div
          className={`alert alert-warning ${baseAlertClass} ${alertClassName}`}
        >
          <HiExclamation className={iconClass} />
          <div className={textClass}>
            <strong>Veuillez corriger les erreurs suivantes :</strong>
            <ul className='list-disc list-inside mt-1'>
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormAlerts;
