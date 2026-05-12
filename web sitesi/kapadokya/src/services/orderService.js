import { mockOrders } from '../data/mockOrders';
import { delay, generateId } from '../utils/formatters';

export const orderService = {
  getAll: async () => {
    await delay(300);
    return [...mockOrders];
  },

  getById: async (orderId) => {
    await delay(200);
    return mockOrders.find(o => o.orderId === orderId) || null;
  },

  getByUser: async (userId) => {
    await delay(300);
    return mockOrders.filter(o => o.userId === userId);
  },

  getBySeller: async (sellerId) => {
    await delay(300);
    return mockOrders.filter(o => o.sellerId === sellerId);
  },

  create: async (orderData) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Sipariş oluşturulamadı');
      }
      
      return result.order;
    } catch (e) {
      console.error("Sipariş hatası:", e.message);
      throw e;
    }
  },

  updateStatus: async (orderId, paymentStatus) => {
    await delay(400);
    const index = mockOrders.findIndex(o => o.orderId === orderId);
    if (index !== -1) {
      mockOrders[index].paymentStatus = paymentStatus;
      return mockOrders[index];
    }
    return null;
  }
};
