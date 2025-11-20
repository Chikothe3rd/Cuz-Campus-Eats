import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface OrderTrackingMapProps {
  orderId: string;
  deliveryLat: number;
  deliveryLng: number;
  runnerLat?: number;
  runnerLng?: number;
}

const OrderTrackingMap = ({ orderId, deliveryLat, deliveryLng, runnerLat, runnerLng }: OrderTrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const runnerMarker = useRef<mapboxgl.Marker | null>(null);
  const deliveryMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Fetch Mapbox token from secrets
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (map.current) return; // Initialize only once

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [deliveryLng, deliveryLat],
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create delivery location marker (green)
    const deliveryEl = document.createElement('div');
    deliveryEl.className = 'delivery-marker';
    deliveryEl.style.width = '40px';
    deliveryEl.style.height = '40px';
    deliveryEl.style.borderRadius = '50%';
    deliveryEl.style.backgroundColor = '#22c55e';
    deliveryEl.style.border = '3px solid white';
    deliveryEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    deliveryEl.style.display = 'flex';
    deliveryEl.style.alignItems = 'center';
    deliveryEl.style.justifyContent = 'center';
    deliveryEl.innerHTML = '🏠';

    deliveryMarker.current = new mapboxgl.Marker(deliveryEl)
      .setLngLat([deliveryLng, deliveryLat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, deliveryLat, deliveryLng]);

  // Update runner marker when location changes
  useEffect(() => {
    if (!map.current || !runnerLat || !runnerLng) return;

    if (runnerMarker.current) {
      runnerMarker.current.setLngLat([runnerLng, runnerLat]);
    } else {
      // Create runner marker (blue with motion indicator)
      const runnerEl = document.createElement('div');
      runnerEl.className = 'runner-marker';
      runnerEl.style.width = '40px';
      runnerEl.style.height = '40px';
      runnerEl.style.borderRadius = '50%';
      runnerEl.style.backgroundColor = '#3b82f6';
      runnerEl.style.border = '3px solid white';
      runnerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      runnerEl.style.display = 'flex';
      runnerEl.style.alignItems = 'center';
      runnerEl.style.justifyContent = 'center';
      runnerEl.innerHTML = '🏃';
      runnerEl.style.animation = 'pulse 2s infinite';

      runnerMarker.current = new mapboxgl.Marker(runnerEl)
        .setLngLat([runnerLng, runnerLat])
        .addTo(map.current!);
    }

    // Fit bounds to show both markers
    if (map.current && deliveryMarker.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([deliveryLng, deliveryLat]);
      bounds.extend([runnerLng, runnerLat]);
      
      map.current.fitBounds(bounds, {
        padding: 80,
        duration: 1000,
      });
    }
  }, [runnerLat, runnerLng, deliveryLat, deliveryLng]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-96 rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-96 rounded-lg shadow-lg" />
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTrackingMap;
