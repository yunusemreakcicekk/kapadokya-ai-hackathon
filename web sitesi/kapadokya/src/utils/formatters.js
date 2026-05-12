// Utility functions

/**
 * Format price with currency
 */
export function formatPrice(price, currency = '₺') {
  return `${currency}${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

/**
 * Format date to Turkish locale
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time
 */
export function formatTime(timeString) {
  return timeString || new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate a unique ID (Firebase-style)
 */
export function generateId(prefix = '') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get stock status
 */
export function getStockStatus(currentStock, criticalStock) {
  if (currentStock <= 0) return { label: 'Tükendi', color: 'danger' };
  if (currentStock <= criticalStock) return { label: 'Kritik Stok', color: 'warning' };
  return { label: 'Stokta', color: 'success' };
}

/**
 * Simulate async delay (for mock service calls)
 */
export function delay(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cultural info text constant
 */
export const CULTURAL_INFO_TEXT = 
  "Bu eser, Kapadokya bölgesinin tescilli teknikleri ve yerel materyalleri (örn: Kızılırmak yatağından alınan kırmızı kil) kullanılarak üretilmiştir.";

/**
 * Convert Google Drive sharing URL to direct image URL
 */
export function convertDriveUrl(url) {
  if (!url) return url;
  
  // Example: https://drive.google.com/file/d/1KqCvRJA0p9QQ-F-xk7mRUZ1Nb6OhTDD3/view?usp=sharing
  // Output:  https://drive.google.com/thumbnail?id=1KqCvRJA0p9QQ-F-xk7mRUZ1Nb6OhTDD3&sz=w1000
  
  // Regex that matches with or without trailing slash
  const driveRegex = /\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  
  return url;
}
