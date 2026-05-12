// Types for all data models - Firebase Firestore compatible
// These types serve as documentation; actual validation happens in services

/**
 * @typedef {Object} User
 * @property {string} userId
 * @property {string} name
 * @property {string} email
 * @property {'admin'|'seller'|'customer'} role
 * @property {string} country
 * @property {string} phone
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Seller
 * @property {string} sellerId
 * @property {string} userId
 * @property {string} storeName
 * @property {string} phone
 * @property {string} address
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Product
 * @property {string} productId
 * @property {string} sellerId
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {number} price
 * @property {number} stock
 * @property {string[]} images
 * @property {string} materials
 * @property {string} technique
 * @property {string} culturalStory
 * @property {string} artisanId
 * @property {string} aiGeneratedTitle
 * @property {string} aiGeneratedDescription
 * @property {string} aiDetectedCategory
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Artisan
 * @property {string} artisanId
 * @property {string} name
 * @property {string} bio
 * @property {string} imageUrl
 * @property {string} region
 * @property {string[]} techniques
 */

/**
 * @typedef {Object} Order
 * @property {string} orderId
 * @property {string} userId
 * @property {string} productId
 * @property {string} sellerId
 * @property {number} price
 * @property {string} shippingOptionId
 * @property {'paid'|'pending'|'failed'} paymentStatus
 * @property {string} orderDate
 * @property {string} orderTime
 * @property {string} country
 * @property {string} rfidCardId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} RFIDCard
 * @property {string} rfidCardId
 * @property {string} userId
 * @property {string} productId
 * @property {string} orderId
 * @property {boolean} isActive
 * @property {string} assignedAt
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} inventoryId
 * @property {string} productId
 * @property {number} currentStock
 * @property {number} criticalStock
 * @property {Object[]} variants
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ShippingOption
 * @property {string} shippingOptionId
 * @property {string} sellerId
 * @property {string} companyName
 * @property {string} deliveryTime
 * @property {number} price
 * @property {boolean} internationalAvailable
 * @property {boolean} freeShipping
 */

/**
 * @typedef {Object} Advertisement
 * @property {string} advertisementId
 * @property {string} productId
 * @property {string} sellerId
 * @property {string} adText
 * @property {string} productIntroText
 * @property {string} voiceAdText
 * @property {string} videoUrl
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Report
 * @property {string} reportId
 * @property {string} sellerId
 * @property {'weekly'|'monthly'|'seasonal'} type
 * @property {string} dateRange
 * @property {number} totalRevenue
 * @property {number} totalOrders
 * @property {Object} countryBreakdown
 * @property {Object[]} topProducts
 */

export const PRODUCT_CATEGORIES = [
  'Vazo', 'Halı', 'Seramik', 'Çömlek', 'Testi', 'Tabak', 'Diğer El Sanatları'
];

export const USER_ROLES = ['admin', 'seller', 'customer'];

export const PAYMENT_STATUSES = ['paid', 'pending', 'failed'];
