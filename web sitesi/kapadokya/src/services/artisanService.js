import { mockArtisans } from '../data/mockArtisans';
import { delay } from '../utils/formatters';

export const artisanService = {
  getAll: async () => {
    await delay(300);
    return [...mockArtisans];
  },

  getById: async (artisanId) => {
    await delay(200);
    return mockArtisans.find(a => a.artisanId === artisanId) || null;
  }
};
