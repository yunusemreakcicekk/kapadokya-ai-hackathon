import { mockRFIDCards } from '../data/mockRFIDCards';
import { mockProducts } from '../data/mockProducts';
import { mockOrders } from '../data/mockOrders';
import { mockUsers } from '../data/mockUsers';
import { delay } from '../utils/formatters';

export const rfidService = {
  getAll: async () => {
    await delay(300);
    return [...mockRFIDCards];
  },

  getByCardId: async (rfidCardId) => {
    await delay(200);
    return mockRFIDCards.find(r => r.rfidCardId === rfidCardId) || null;
  },

  getByUser: async (userId) => {
    await delay(300);
    return mockRFIDCards.filter(r => r.userId === userId);
  },

  /**
   * Look up full product + order + user info from RFID card
   * Modified to support direct productId lookup for the hackathon demo
   */
  lookupCard: async (rfidCardId) => {
    await delay(600);
    
    // Önce gerçek veritabanından (Firebase) productId olarak arayalım
    const { productService } = require('./productService');
    const realProduct = await productService.getById(rfidCardId);
    
    if (realProduct) {
      return {
        card: { rfidCardId: rfidCardId, isActive: true },
        product: realProduct,
        order: { orderId: 'O-' + Math.floor(Math.random() * 10000), orderDate: new Date().toISOString(), orderTime: '14:30', paymentStatus: 'paid' },
        user: { name: 'Kapadokya Misafiri', country: 'Türkiye' }
      };
    }

    // Eğer Firebase'de bulamazsa eski mock data'ya baksın (Demo kartlar için)
    const card = mockRFIDCards.find(r => r.rfidCardId === rfidCardId);
    if (!card) return null;

    const product = mockProducts.find(p => p.productId === card.productId);
    const order = mockOrders.find(o => o.orderId === card.orderId);
    const user = mockUsers.find(u => u.userId === card.userId);

    return {
      card,
      product,
      order,
      user
    };
  },

  assignCard: async (rfidCardId, userId, productId, orderId) => {
    await delay(500);
    const newCard = {
      rfidCardId,
      userId,
      productId,
      orderId,
      isActive: true,
      assignedAt: new Date().toISOString()
    };
    mockRFIDCards.push(newCard);
    return newCard;
  }
};
