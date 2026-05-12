'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SalesChart({ monthlySales, countrySales }) {
  if (!monthlySales || monthlySales.length === 0) {
    return <div className="flex items-center justify-center h-full text-earth">Veri yükleniyor...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8B08C40" />
        <XAxis dataKey="month" tick={{ fill: '#B08968', fontSize: 12 }} />
        <YAxis tick={{ fill: '#B08968', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFBF7',
            border: '1px solid #D8B08C',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(94,60,35,0.08)',
          }}
          labelStyle={{ color: '#3E2A1F', fontWeight: 600 }}
          formatter={(value, name) => [
            name === 'revenue' ? `₺${value.toLocaleString('tr-TR')}` : value,
            name === 'revenue' ? 'Gelir' : 'Sipariş'
          ]}
        />
        <Legend formatter={(value) => value === 'revenue' ? 'Gelir' : 'Sipariş'} />
        <Bar dataKey="revenue" fill="#C65A2E" radius={[6, 6, 0, 0]} />
        <Bar dataKey="orders" fill="#F2A65A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
