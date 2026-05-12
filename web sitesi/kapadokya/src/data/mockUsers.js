export const mockUsers = [
  {
    userId: 'user-001',
    name: 'Ayşe Yıldız',
    email: 'ayse@example.com',
    role: 'customer',
    country: 'Türkiye',
    phone: '+90 532 111 2233',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    userId: 'user-002',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'customer',
    country: 'United States',
    phone: '+1 555 123 4567',
    createdAt: '2026-02-15T12:00:00Z'
  },
  {
    userId: 'user-003',
    name: 'Ahmet Usta',
    email: 'ahmet@example.com',
    role: 'seller',
    country: 'Türkiye',
    phone: '+90 532 333 4455',
    createdAt: '2025-11-20T09:00:00Z'
  },
  {
    userId: 'user-004',
    name: 'Elif Kara',
    email: 'elif@example.com',
    role: 'seller',
    country: 'Türkiye',
    phone: '+90 532 555 6677',
    createdAt: '2025-10-05T10:00:00Z'
  },
  {
    userId: 'user-005',
    name: 'Admin Kullanıcı',
    email: 'admin@kapadokya.com',
    role: 'admin',
    country: 'Türkiye',
    phone: '+90 532 000 0001',
    createdAt: '2025-06-01T08:00:00Z'
  },
  {
    userId: 'user-006',
    name: 'Marie Dubois',
    email: 'marie@example.com',
    role: 'customer',
    country: 'France',
    phone: '+33 6 12 34 56 78',
    createdAt: '2026-03-20T14:30:00Z'
  }
];

export const mockSellers = [
  {
    sellerId: 'seller-001',
    userId: 'user-003',
    storeName: 'Ahmet Usta - Kapadokya Çömlek Atölyesi',
    specialty: 'Çömlek',
    phone: '+90 532 333 4455',
    address: 'Avanos Çarşı Mah. No:12, Nevşehir',
    createdAt: '2025-11-20T09:00:00Z'
  },
  {
    sellerId: 'seller-002',
    userId: 'user-004',
    storeName: 'Göreme El Sanatları',
    phone: '+90 532 555 6677',
    address: 'Göreme Müze Cad. No:5, Nevşehir',
    createdAt: '2025-10-05T10:00:00Z'
  }
];
