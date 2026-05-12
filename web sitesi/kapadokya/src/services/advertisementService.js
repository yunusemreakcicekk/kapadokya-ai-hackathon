import { mockAdvertisements } from '../data/mockAdvertisements';
import { delay, generateId } from '../utils/formatters';

export const advertisementService = {
  getAll: async () => {
    await delay(300);
    return [...mockAdvertisements];
  },

  getByProduct: async (productId) => {
    await delay(200);
    return mockAdvertisements.find(a => a.productId === productId) || null;
  },

  getBySeller: async (sellerId) => {
    await delay(300);
    return mockAdvertisements.filter(a => a.sellerId === sellerId);
  },

  create: async (adData) => {
    await delay(500);
    const newAd = {
      ...adData,
      advertisementId: generateId('ad-'),
      createdAt: new Date().toISOString()
    };
    mockAdvertisements.push(newAd);
    return newAd;
  },

  update: async (advertisementId, data) => {
    await delay(400);
    const index = mockAdvertisements.findIndex(a => a.advertisementId === advertisementId);
    if (index !== -1) {
      mockAdvertisements[index] = { ...mockAdvertisements[index], ...data };
      return mockAdvertisements[index];
    }
    return null;
  }
};
