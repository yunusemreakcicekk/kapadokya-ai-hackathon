import { mockReports, monthlySalesData, countrySalesData } from '../data/mockReports';
import { delay } from '../utils/formatters';

export const reportService = {
  getAll: async () => {
    await delay(300);
    return [...mockReports];
  },

  getBySeller: async (sellerId) => {
    await delay(300);
    return mockReports.filter(r => r.sellerId === sellerId);
  },

  getByType: async (sellerId, type) => {
    await delay(300);
    return mockReports.filter(r => r.sellerId === sellerId && r.type === type);
  },

  getMonthlySalesData: async () => {
    await delay(200);
    return [...monthlySalesData];
  },

  getCountrySalesData: async () => {
    await delay(200);
    return [...countrySalesData];
  }
};
