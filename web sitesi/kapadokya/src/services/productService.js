import { mockProducts } from '../data/mockProducts';

export const productService = {
  getAll: async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('API yanıt vermedi');
      const data = await res.json();
      
      // Eğer Firebase boşsa veya hata varsa fallback olarak mock dönebiliriz 
      // (Test sürecinde site boş görünmesin isterseniz)
      if (data.length === 0) {
        console.log('Firebase Urunler koleksiyonu boş.');
        return [];
      }
      return data;
    } catch (e) {
      console.error("API hatası, mock veriye düşülüyor:", e);
      return [...mockProducts];
    }
  },

  getById: async (productId) => {
    try {
      const all = await productService.getAll();
      return all.find(p => p.productId === productId) || null;
    } catch (e) {
      return mockProducts.find(p => p.productId === productId) || null;
    }
  },

  create: async (productData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('API yanıt vermedi');
      const result = await res.json();
      return { ...(result.data || productData), productId: result.id };
    } catch (e) {
      console.error("Firebase ekleme hatası:", e);
      return { ...productData, productId: `RFID-${Math.floor(Math.random() * 100000)}` };
    }
  },

  update: async (productId, data) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.error || `HTTP Hata: ${res.status}`);
      }
      return { productId, ...data };
    } catch (e) {
      console.error("Firebase güncelleme hatası:", e.message);
      throw e;
    }
  },

  delete: async (productId) => {
    return true;
  },

  getByCategory: async (category) => {
    const all = await productService.getAll();
    return all.filter(p => p.category === category);
  },

  getBySeller: async (sellerId) => {
    const all = await productService.getAll();
    return all.filter(p => p.artisanId === sellerId);
  },

  search: async (query) => {
    const all = await productService.getAll();
    const q = query.toLowerCase();
    return all.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
};

