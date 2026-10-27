import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch Hook
 * Generic data fetching hook with loading, error states, and refetch capability
 * 
 * @param {function} fetchFn - Async function that fetches data
 * @param {array} deps - Dependencies array to trigger refetch
 * @param {object} options - Additional options
 * @returns {{ data, loading, error, refetch }}
 * 
 * @example
 * // Basic usage
 * const { data, loading, error, refetch } = useFetch(
 *   () => userService.getAll(),
 *   []
 * );
 * 
 * @example
 * // With dependencies
 * const { data, loading } = useFetch(
 *   () => academicService.courses.getBySubject(subjectId),
 *   [subjectId]
 * );
 * 
 * @example
 * // With options
 * const { data } = useFetch(
 *   () => userService.getAll(),
 *   [],
 *   { initialData: [], enabled: isReady, onSuccess: (data) => console.log(data) }
 * );
 */

export default function useFetch(fetchFn, deps = [], options = {}) {
  const {
    initialData = null,
    enabled = true,
    onSuccess,
    onError,
    transform,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const fetchId = ++fetchIdRef.current;
    
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      // Only update if this is the latest request and component is mounted
      if (isMounted.current && fetchId === fetchIdRef.current) {
        const transformedData = transform ? transform(result) : result;
        setData(transformedData);
        onSuccess?.(transformedData);
      }
    } catch (err) {
      if (isMounted.current && fetchId === fetchIdRef.current) {
        const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi';
        setError(errorMessage);
        onError?.(err);
      }
    } finally {
      if (isMounted.current && fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, enabled, transform, onSuccess, onError]);

  // Initial fetch and refetch on deps change
  useEffect(() => {
    fetchData();
  }, [...deps, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Manual refetch function
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * useMutation Hook
 * For POST/PUT/DELETE operations with manual trigger
 * 
 * @param {function} mutationFn - Async function that performs mutation
 * @param {object} options - Additional options
 * @returns {{ mutate, loading, error, data, reset }}
 * 
 * @example
 * const { mutate, loading } = useMutation(
 *   (userData) => userService.create(userData),
 *   { onSuccess: () => refetchUsers() }
 * );
 * 
 * // In form submit handler
 * await mutate(formData);
 */

export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(...args);
      setData(result);
      onSuccess?.(result, ...args);
      onSettled?.(result, null, ...args);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi';
      setError(errorMessage);
      onError?.(err, ...args);
      onSettled?.(null, err, ...args);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { mutate, loading, error, data, reset };
}

/**
 * usePagination Hook
 * Paginated data fetching with page controls
 * 
 * @param {function} fetchFn - Function that accepts (page, limit) and returns paginated data
 * @param {object} options - Pagination options
 * @returns {{ data, loading, error, page, totalPages, nextPage, prevPage, goToPage }}
 */

export function usePagination(fetchFn, options = {}) {
  const { initialPage = 1, limit = 10, enabled = true } = options;

  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { data, loading, error, refetch } = useFetch(
    () => fetchFn(page, limit),
    [page, limit],
    {
      enabled,
      transform: (result) => {
        // Assume API returns { data: [], total: number, page: number, totalPages: number }
        if (result?.totalPages) setTotalPages(result.totalPages);
        if (result?.total) setTotalItems(result.total);
        return result?.data || result;
      },
    }
  );

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToPage = useCallback((newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalItems,
    limit,
    nextPage,
    prevPage,
    goToPage,
    refetch,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
