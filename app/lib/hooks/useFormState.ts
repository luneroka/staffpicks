import { useState, useEffect, useCallback } from 'react';

/**
 * Form state management hook
 * Handles error, success, and loading states with auto-dismiss functionality
 */
export interface FormState {
  error: string;
  success: string;
  isLoading: boolean;
}

export interface FormStateActions {
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setIsLoading: (loading: boolean) => void;
  clearMessages: () => void;
  clearError: () => void;
  clearSuccess: () => void;
}

export interface UseFormStateOptions {
  /**
   * Auto-dismiss success message after specified milliseconds
   * @default 3000
   */
  autoSuccessDismiss?: number;

  /**
   * Auto-dismiss error message after specified milliseconds
   * @default 0 (disabled)
   */
  autoErrorDismiss?: number;

  /**
   * Clear error/success when loading starts
   * @default true
   */
  clearOnLoad?: boolean;
}

/**
 * Custom hook for managing form state (error, success, loading)
 * Provides consistent error/success message handling with auto-dismiss
 *
 * @example
 * ```tsx
 * const { error, success, isLoading, setError, setSuccess, setIsLoading, clearMessages } = useFormState();
 *
 * const handleSubmit = async () => {
 *   setIsLoading(true);
 *   try {
 *     await saveData();
 *     setSuccess('Saved successfully!');
 *   } catch (err) {
 *     setError(err.message);
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 * ```
 *
 * @example With custom auto-dismiss timing
 * ```tsx
 * const formState = useFormState({
 *   autoSuccessDismiss: 5000,  // Dismiss after 5 seconds
 *   autoErrorDismiss: 4000     // Dismiss error after 4 seconds
 * });
 * ```
 */
export function useFormState(options: UseFormStateOptions = {}) {
  const {
    autoSuccessDismiss = 3000,
    autoErrorDismiss = 0,
    clearOnLoad = true,
  } = options;

  const [error, setErrorState] = useState<string>('');
  const [success, setSuccessState] = useState<string>('');
  const [isLoading, setIsLoadingState] = useState<boolean>(false);

  // Auto-dismiss success message
  useEffect(() => {
    if (success && autoSuccessDismiss > 0) {
      const timer = setTimeout(() => {
        setSuccessState('');
      }, autoSuccessDismiss);

      return () => clearTimeout(timer);
    }
  }, [success, autoSuccessDismiss]);

  // Auto-dismiss error message (if enabled)
  useEffect(() => {
    if (error && autoErrorDismiss > 0) {
      const timer = setTimeout(() => {
        setErrorState('');
      }, autoErrorDismiss);

      return () => clearTimeout(timer);
    }
  }, [error, autoErrorDismiss]);

  // Clear messages when loading starts (if enabled)
  useEffect(() => {
    if (isLoading && clearOnLoad) {
      setErrorState('');
      setSuccessState('');
    }
  }, [isLoading, clearOnLoad]);

  const setError = useCallback((error: string) => {
    setErrorState(error);
    setSuccessState(''); // Clear success when error is set
  }, []);

  const setSuccess = useCallback((success: string) => {
    setSuccessState(success);
    setErrorState(''); // Clear error when success is set
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  const clearMessages = useCallback(() => {
    setErrorState('');
    setSuccessState('');
  }, []);

  const clearError = useCallback(() => {
    setErrorState('');
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessState('');
  }, []);

  return {
    // State
    error,
    success,
    isLoading,

    // Actions
    setError,
    setSuccess,
    setIsLoading,
    clearMessages,
    clearError,
    clearSuccess,
  };
}
