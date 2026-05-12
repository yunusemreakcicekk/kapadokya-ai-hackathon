import { mockShipping } from '../data/mockShipping';
import { delay, generateId } from '../utils/formatters';

export const shippingService = {
  getAll: async () => {
    await delay(300);
    return [...mockShipping];
  },

  getById: async (shippingOptionId) => {
    await delay(200);
    return mockShipping.find(s => s.shippingOptionId === shippingOptionId) || null;
  },

  getBySeller: async (sellerId) => {
    await delay(300);
    return mockShipping.filter(s => s.sellerId === sellerId);
  },

  getInternational: async () => {
    await delay(300);
    return mockShipping.filter(s => s.internationalAvailable);
  },

  create: async (shippingData) => {
    await delay(500);
    const newShipping = {
      ...shippingData,
      shippingOptionId: generateId('ship-')
    };
    mockShipping.push(newShipping);
    return newShipping;
  }
};
