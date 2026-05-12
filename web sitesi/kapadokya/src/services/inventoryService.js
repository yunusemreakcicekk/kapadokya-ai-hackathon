import { mockInventory } from '../data/mockInventory';
import { delay } from '../utils/formatters';

export const inventoryService = {
  getAll: async () => {
    await delay(300);
    return [...mockInventory];
  },

  getByProduct: async (productId) => {
    await delay(200);
    return mockInventory.find(i => i.productId === productId) || null;
  },

  getCriticalStock: async () => {
    await delay(300);
    return mockInventory.filter(i => i.currentStock <= i.criticalStock);
  },

  updateStock: async (inventoryId, newStock) => {
    await delay(400);
    const index = mockInventory.findIndex(i => i.inventoryId === inventoryId);
    if (index !== -1) {
      mockInventory[index].currentStock = newStock;
      mockInventory[index].updatedAt = new Date().toISOString();
      return mockInventory[index];
    }
    return null;
  },

  decrementStock: async (productId, quantity = 1) => {
    await delay(400);
    const index = mockInventory.findIndex(i => i.productId === productId);
    if (index !== -1) {
      mockInventory[index].currentStock -= quantity;
      mockInventory[index].updatedAt = new Date().toISOString();
      return mockInventory[index];
    }
    return null;
  }
};
