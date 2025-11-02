import { useEffect, useRef, useState } from 'react';

interface DeliveryMapProps {
  onLocationSelect?: (address: string, lat: number, lng: number) => void;
  deliveryLocation?: { lat: number; lng: number; address: string };
  searchAddress?: string;
}
const DeliveryMap = ({ onLocationSelect, deliveryLocation, searchAddress }: DeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [ready, setReady] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY.');
      return;
    }

    const existing = document.getElementById('google-maps-js');
    if (existing) {
      // Already loaded
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
  script.onload = () => initMap();
    document.body.appendChild(script);

    function initMap() {
      if (!mapContainer.current || mapRef.current) return;
      const center = deliveryLocation
        ? { lat: deliveryLocation.lat, lng: deliveryLocation.lng }
        : { lat: -15.3875, lng: 28.3228 }; // Lusaka default

      // Create map with satellite imagery
      const map = new (window as any).google.maps.Map(mapContainer.current, {
        center,
        zoom: deliveryLocation ? 15 : 13,
        mapTypeId: 'satellite',
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: false,
      });
  mapRef.current = map as unknown as google.maps.Map;

      geocoderRef.current = new (window as any).google.maps.Geocoder();

      // Place initial marker if provided
      if (deliveryLocation) {
        setMarker(center);
      }

      // Click to place marker and reverse geocode
      (map as any).addListener('click', (e: any) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarker(pos);
        reverseGeocode(pos);
      });
      setReady(true);

      // Helper: set or create marker and wire dragend
      function setMarker(position: { lat: number; lng: number }) {
        if (!markerRef.current) {
          markerRef.current = new (window as any).google.maps.Marker({
            position,
            map,
            draggable: true,
          });
          (markerRef.current as any).addListener('dragend', () => {
            const pos = (markerRef.current as any).getPosition();
            const coords = { lat: pos.lat(), lng: pos.lng() };
            reverseGeocode(coords);
          });
        } else {
          (markerRef.current as any).setPosition(position);
        }
      }

      // Helper: reverse geocode and callback
      function reverseGeocode(position: { lat: number; lng: number }) {
        if (!geocoderRef.current) return;
        (geocoderRef.current as any).geocode({ location: position }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const addr = results[0].formatted_address;
            if (onLocationSelect) onLocationSelect(addr, position.lat, position.lng);
          }
        });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the parent passes a new address, geocode and update map
  useEffect(() => {
    if (!searchAddress || !mapRef.current || !geocoderRef.current) return;
    (geocoderRef.current as any).geocode({ address: searchAddress }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const center = { lat: loc.lat(), lng: loc.lng() };
        (mapRef.current as any).setCenter(center);
        (mapRef.current as any).setZoom(16);
        if (!markerRef.current) {
          markerRef.current = new (window as any).google.maps.Marker({ map: mapRef.current, position: center, draggable: true });
        } else {
          (markerRef.current as any).setPosition(center);
        }
      }
    });
  }, [searchAddress]);

  // When map becomes ready, sync to incoming address or coords
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (deliveryLocation) {
      const center = { lat: deliveryLocation.lat, lng: deliveryLocation.lng };
      (mapRef.current as any).setCenter(center);
      (mapRef.current as any).setZoom(15);
      if (!markerRef.current) {
        markerRef.current = new (window as any).google.maps.Marker({ map: mapRef.current, position: center, draggable: true });
      } else {
        (markerRef.current as any).setPosition(center);
      }
    } else if (searchAddress) {
      // Trigger geocode for initial address if present
      (geocoderRef.current as any)?.geocode({ address: searchAddress }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const center = { lat: loc.lat(), lng: loc.lng() };
          (mapRef.current as any).setCenter(center);
          (mapRef.current as any).setZoom(16);
          if (!markerRef.current) {
            markerRef.current = new (window as any).google.maps.Marker({ map: mapRef.current, position: center, draggable: true });
          } else {
            (markerRef.current as any).setPosition(center);
          }
        }
      });
    }
  }, [ready]);

  // Keep marker in sync if deliveryLocation prop changes later
  useEffect(() => {
    if (!mapRef.current || !deliveryLocation) return;
    const center = { lat: deliveryLocation.lat, lng: deliveryLocation.lng };
    (mapRef.current as any).panTo(center);
    if (!markerRef.current) {
      markerRef.current = new (window as any).google.maps.Marker({ map: mapRef.current, position: center, draggable: true });
    } else {
      (markerRef.current as any).setPosition(center);
    }
  }, [deliveryLocation?.lat, deliveryLocation?.lng]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default DeliveryMap;
