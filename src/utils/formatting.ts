/**
 * Centralized formatting utilities for consistent data presentation across the application.
 */

/**
 * Format currency values with Indian locale
 */
export function formatCurrency(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

/**
 * Format numbers with Indian locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

/**
 * Format percentages
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format dates consistently
 */
export function formatDate(date: Date | number | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return dateObj.toLocaleString("en-IN", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(date: Date | number | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return dateObj.toLocaleDateString("en-IN", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time only
 */
export function formatTimeOnly(date: Date | number | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return dateObj.toLocaleTimeString("en-IN", {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format file sizes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitleCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}
