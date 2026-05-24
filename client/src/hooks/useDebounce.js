import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value changes
 * @param {*} value - The input value to debounce
 * @param {number} delay - Debounce duration in milliseconds (default: 300ms)
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
