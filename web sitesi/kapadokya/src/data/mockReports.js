export const mockReports = [
  {
    reportId: 'report-001',
    sellerId: 'seller-001',
    type: 'monthly',
    dateRange: 'Nisan 2026',
    totalRevenue: 18500,
    totalOrders: 12,
    countryBreakdown: {
      'Türkiye': { orders: 7, revenue: 12250 },
      'United States': { orders: 3, revenue: 3800 },
      'Germany': { orders: 1, revenue: 1250 },
      'France': { orders: 1, revenue: 1200 }
    },
    totalCarbonFootprintKg: 24.6,
    totalDistanceKm: 18450,
    countryCarbonBreakdown: {
      'Türkiye': 4.2,
      'United States': 15.5,
      'Germany': 2.4,
      'France': 2.5
    },
    transportModeBreakdown: {
      'Kara (TIR)': 45,
      'Hava Kargo': 40,
      'Deniz Yolu': 10,
      'Demiryolu': 5
    },
    totalRevenueTRY: 18500,
    convertedRevenue: 525.56,
    selectedCurrency: 'EUR',
    exchangeRateSource: 'TCMB (Mock)',
    topProducts: [
      { productId: 'prod-001', name: 'Kapadokya Kırmızı Kil Vazo', totalSold: 5, revenue: 6250 },
      { productId: 'prod-002', name: 'Avanos El Dokuma Halı', totalSold: 3, revenue: 13500 },
      { productId: 'prod-004', name: 'Ürgüp Geleneksel Çömlek', totalSold: 4, revenue: 2600 }
    ]
  },
  {
    reportId: 'report-002',
    sellerId: 'seller-002',
    type: 'monthly',
    dateRange: 'Nisan 2026',
    totalRevenue: 14200,
    totalOrders: 15,
    countryBreakdown: {
      'Türkiye': { orders: 8, revenue: 7800 },
      'United States': { orders: 4, revenue: 3920 },
      'Japan': { orders: 2, revenue: 1580 },
      'United Kingdom': { orders: 1, revenue: 900 }
    },
    totalCarbonFootprintKg: 31.2,
    totalDistanceKm: 22100,
    countryCarbonBreakdown: {
      'Türkiye': 4.8,
      'United States': 18.2,
      'Japan': 5.5,
      'United Kingdom': 2.7
    },
    transportModeBreakdown: {
      'Kara (TIR)': 50,
      'Hava Kargo': 35,
      'Deniz Yolu': 15,
      'Demiryolu': 0
    },
    totalRevenueTRY: 14200,
    convertedRevenue: 436.25,
    selectedCurrency: 'USD',
    exchangeRateSource: 'TCMB (Mock)',
    topProducts: [
      { productId: 'prod-003', name: 'Göreme Seramik Tabak', totalSold: 6, revenue: 5100 },
      { productId: 'prod-006', name: 'Nevşehir El İşi Dekoratif Tabak', totalSold: 5, revenue: 4900 },
      { productId: 'prod-005', name: 'Kapadokya Testi', totalSold: 4, revenue: 1800 }
    ]
  },
  {
    reportId: 'report-003',
    sellerId: 'seller-001',
    type: 'weekly',
    dateRange: '21-27 Nisan 2026',
    totalRevenue: 5750,
    totalOrders: 4,
    countryBreakdown: {
      'Türkiye': { orders: 2, revenue: 3500 },
      'France': { orders: 1, revenue: 1250 },
      'Germany': { orders: 1, revenue: 1000 }
    },
    totalCarbonFootprintKg: 6.2,
    totalDistanceKm: 4200,
    countryCarbonBreakdown: {
      'Türkiye': 1.1,
      'France': 2.6,
      'Germany': 2.5
    },
    transportModeBreakdown: {
      'Kara (TIR)': 60,
      'Hava Kargo': 20,
      'Deniz Yolu': 10,
      'Demiryolu': 10
    },
    totalRevenueTRY: 5750,
    convertedRevenue: 163.35,
    selectedCurrency: 'EUR',
    exchangeRateSource: 'TCMB (Mock)',
    topProducts: [
      { productId: 'prod-001', name: 'Kapadokya Kırmızı Kil Vazo', totalSold: 2, revenue: 2500 },
      { productId: 'prod-002', name: 'Avanos El Dokuma Halı', totalSold: 1, revenue: 4500 }
    ]
  }
];

// Monthly sales data for charts
export const monthlySalesData = [
  { month: 'Oca', revenue: 8500, orders: 6 },
  { month: 'Şub', revenue: 12000, orders: 9 },
  { month: 'Mar', revenue: 15500, orders: 11 },
  { month: 'Nis', revenue: 18500, orders: 12 },
  { month: 'May', revenue: 0, orders: 0 },
];

// Country sales data for pie chart
export const countrySalesData = [
  { country: 'Türkiye', value: 45, color: '#C65A2E' },
  { country: 'ABD', value: 25, color: '#E07A3F' },
  { country: 'Almanya', value: 12, color: '#F2A65A' },
  { country: 'Fransa', value: 10, color: '#D8B08C' },
  { country: 'Japonya', value: 5, color: '#B08968' },
  { country: 'İngiltere', value: 3, color: '#5A3E2B' },
];
