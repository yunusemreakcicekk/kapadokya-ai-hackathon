import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { origin, dest } = await request.json();

    if (!origin || !dest) {
      return NextResponse.json({ error: 'Origin and destination coordinates are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouteService API key is missing' }, { status: 500 });
    }

    // Call OpenRouteService API
    const url = `https://api.openrouteservice.org/v2/directions/driving-hgv?api_key=${apiKey}&start=${origin.lng},${origin.lat}&end=${dest.lng},${dest.lat}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    });

    if (!response.ok) {
      throw new Error(`ORS API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const route = data.features[0];
      const distance = route.properties.summary.distance; // in meters
      const distanceKm = distance / 1000;
      const geometry = route.geometry; // GeoJSON geometry (coordinates array: [lng, lat])

      return NextResponse.json({
        distanceKm,
        geometry
      });
    } else {
      throw new Error('No route found');
    }

  } catch (error) {
    console.error('Routing API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
