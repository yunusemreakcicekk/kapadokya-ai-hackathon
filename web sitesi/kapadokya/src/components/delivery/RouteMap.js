'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon issue in Next.js/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RouteMap = ({ origin, dest, geometry }) => {
  const [positions, setPositions] = useState([]);
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    if (origin && dest) {
      let currentPositions = [];
      
      // If we have ORS geometry (GeoJSON LineString)
      if (geometry && geometry.coordinates) {
        // ORS returns [lng, lat], Leaflet needs [lat, lng]
        currentPositions = geometry.coordinates.map(coord => [coord[1], coord[0]]);
      } else {
        // Fallback straight line
        currentPositions = [
          [origin.lat, origin.lng],
          [dest.lat, dest.lng]
        ];
      }
      
      setPositions(currentPositions);

      if (currentPositions.length > 0) {
        const lBounds = L.latLngBounds(currentPositions);
        setBounds(lBounds);
      }
    }
  }, [origin, dest, geometry]);

  if (!origin || !dest || !bounds) {
    return (
      <div className="w-full h-64 md:h-80 rounded-2xl border border-[#C65A2E]/20 shadow-sm bg-[#F5E6D3]/30 flex items-center justify-center text-[#5A3E2B] font-medium">
        Harita verisi hazırlanıyor...
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-stone/20 shadow-sm relative z-0">
      <MapContainer 
        key={`${origin.lat}-${dest.lat}-${positions.length}`}
        bounds={bounds}
        scrollWheelZoom={false} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Routing: <a href="https://openrouteservice.org/">ORS</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[origin.lat, origin.lng]}>
          <Popup>Üretim Noktası</Popup>
        </Marker>
        
        <Marker position={[dest.lat, dest.lng]}>
          <Popup>Teslimat Noktası</Popup>
        </Marker>

        {positions.length > 0 && (
          <Polyline 
            positions={positions} 
            color="#C65A2E" // Terracotta color
            weight={4}
            opacity={0.8}
            dashArray={geometry ? null : "5, 10"} // Dashed if mock
          />
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
