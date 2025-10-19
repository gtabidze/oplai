import { useEffect, useState } from 'react';
import { Plaibook } from './types';

export function getAllPlaibooks(): Plaibook[] {
  try {
    const stored = window.localStorage.getItem('plaibooks');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function savePlaibook(plaibook: Plaibook): void {
  try {
    const plaibooks = getAllPlaibooks();
    const index = plaibooks.findIndex(p => p.id === plaibook.id);
    
    if (index >= 0) {
      plaibooks[index] = plaibook;
    } else {
      plaibooks.push(plaibook);
    }
    
    window.localStorage.setItem('plaibooks', JSON.stringify(plaibooks));
  } catch (error) {
    console.error(error);
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
