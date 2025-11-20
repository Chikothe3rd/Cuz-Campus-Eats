import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderLocation {
  runner_lat: number | null;
  runner_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_status: string;
  last_location_update: string | null;
}

export const useOrderTracking = (orderId: string) => {
  const [location, setLocation] = useState<OrderLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial location
    const fetchLocation = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('runner_lat, runner_lng, delivery_lat, delivery_lng, delivery_status, last_location_update')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order location:', error);
        setLoading(false);
        return;
      }

      setLocation(data);
      setLoading(false);
    };

    fetchLocation();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Location update received:', payload);
          setLocation(payload.new as OrderLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { location, loading };
};
