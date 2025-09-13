/**
 * Common data transformation utilities for consistent data handling across the application.
 */

/**
 * Flatten nested object into dot notation keys
 */
export function flattenObject(
  obj: Record<string, any>,
  prefix: string = ''
): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Extract answers from nested section data
 */
export function extractAnswersFromSection(
  sectionData: any,
  result: Record<string, any> = {}
): Record<string, any> {
  if (Array.isArray(sectionData)) {
    sectionData.forEach(item => extractAnswersFromSection(item, result));
  } else if (sectionData && typeof sectionData === 'object') {
    if (sectionData.id && sectionData.answer !== undefined) {
      result[sectionData.id] = sectionData.answer;
    }
    Object.values(sectionData).forEach(value =>
      extractAnswersFromSection(value, result)
    );
  }

  return result;
}

/**
 * Group array items by key
 */
export function groupBy<T, K extends keyof any>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

/**
 * Sort array by multiple criteria
 */
export function sortBy<T>(
  array: T[],
  ...criteria: Array<(item: T) => any>
): T[] {
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      const aValue = criterion(a);
      const bValue = criterion(b);

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
    }
    return 0;
  });
}

/**
 * Remove duplicates from array
 */
export function unique<T>(
  array: T[],
  keyFn?: (item: T) => any
): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * Pick specific properties from object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific properties from object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Merge objects deeply
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        result[key] &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key] as T[typeof key];
      }
    }
  }

  return result;
}
