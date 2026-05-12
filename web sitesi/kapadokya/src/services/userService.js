import { mockUsers, mockSellers } from '../data/mockUsers';
import { delay } from '../utils/formatters';

export const userService = {
  getAll: async () => {
    await delay(300);
    return [...mockUsers];
  },

  getById: async (userId) => {
    await delay(200);
    return mockUsers.find(u => u.userId === userId) || null;
  },

  getByEmail: async (email) => {
    await delay(200);
    return mockUsers.find(u => u.email === email) || null;
  },

  getByRole: async (role) => {
    await delay(300);
    return mockUsers.filter(u => u.role === role);
  },

  login: async (email, role) => {
    await delay(500);
    // In Firebase: signInWithEmailAndPassword + custom claims
    const user = mockUsers.find(u => u.email === email || u.role === role);
    return user || null;
  },

  // Seller-specific
  getSeller: async (sellerId) => {
    await delay(200);
    return mockSellers.find(s => s.sellerId === sellerId) || null;
  },

  getSellerByUserId: async (userId) => {
    await delay(200);
    return mockSellers.find(s => s.userId === userId) || null;
  },

  getAllSellers: async () => {
    await delay(300);
    return [...mockSellers];
  }
};
