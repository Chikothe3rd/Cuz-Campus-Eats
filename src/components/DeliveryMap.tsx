import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

interface DeliveryMapProps {
  onLocationSelect?: (address: string, lat: number, lng: number) => void;
  deliveryLocation?: { lat: number; lng: number; address: string };
}

const DeliveryMap = ({ onLocationSelect, deliveryLocation }: DeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: deliveryLocation ? [deliveryLocation.lng, deliveryLocation.lat] : [0, 0],
      zoom: deliveryLocation ? 15 : 12,
    });

    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geocoder search
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: 'Search for delivery location...',
    });

    newMap.addControl(geocoder);

    // Handle geocoder result
    geocoder.on('result', (e) => {
      const { center, place_name } = e.result;
      if (onLocationSelect) {
        onLocationSelect(place_name, center[1], center[0]);
      }
      
      // Update marker position
      if (marker.current) {
        marker.current.setLngLat(center);
      } else {
        marker.current = new mapboxgl.Marker({ color: '#FF6B6B', draggable: true })
          .setLngLat(center)
          .addTo(newMap);

        // Handle marker drag
        marker.current.on('dragend', () => {
          const lngLat = marker.current!.getLngLat();
          
          // Reverse geocode to get address
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.features && data.features.length > 0 && onLocationSelect) {
                onLocationSelect(data.features[0].place_name, lngLat.lat, lngLat.lng);
              }
            });
        });
      }
    });

    // Add click handler to map
    newMap.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ color: '#FF6B6B', draggable: true })
          .setLngLat([lng, lat])
          .addTo(newMap);

        marker.current.on('dragend', () => {
          const lngLat = marker.current!.getLngLat();
          
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.features && data.features.length > 0 && onLocationSelect) {
                onLocationSelect(data.features[0].place_name, lngLat.lat, lngLat.lng);
              }
            });
        });
      }

      // Reverse geocode
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.features && data.features.length > 0 && onLocationSelect) {
            onLocationSelect(data.features[0].place_name, lat, lng);
          }
        });
    });

    newMap.on('load', () => {
      setMapLoaded(true);
      
      // Add initial marker if delivery location exists
      if (deliveryLocation) {
        marker.current = new mapboxgl.Marker({ color: '#FF6B6B', draggable: true })
          .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
          .addTo(newMap);

        marker.current.on('dragend', () => {
          const lngLat = marker.current!.getLngLat();
          
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.features && data.features.length > 0 && onLocationSelect) {
                onLocationSelect(data.features[0].place_name, lngLat.lat, lngLat.lng);
              }
            });
        });
      }
    });

    map.current = newMap;

    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      newMap.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default DeliveryMap;
