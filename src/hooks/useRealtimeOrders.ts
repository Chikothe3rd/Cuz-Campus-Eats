import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];

export const useRealtimeOrders = (userId: string | undefined, userRole: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        let query = supabase.from('orders').select('*');

        // Filter based on role
        if (userRole === 'buyer') {
          query = query.eq('buyer_id', userId);
        } else if (userRole === 'vendor') {
          // Get vendor ID first
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', userId)
            .single();
          
          if (vendor) {
            query = query.eq('vendor_id', vendor.id);
          }
        } else if (userRole === 'runner') {
          query = query.or(`runner_id.eq.${userId},delivery_status.eq.pending`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Refetch orders when any change occurs
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole]);

  return { orders, loading };
};
