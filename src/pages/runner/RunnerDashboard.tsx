import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { formatZMW } from '@/lib/utils';

interface Order {
  id: string;
  vendor_id: string;
  buyer_id: string;
  runner_id: string | null;
  items: any[];
  total: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_notes: string | null;
  delivery_status: string;
  created_at: string;
  vendors?: {
    name: string;
  };
}

const RunnerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const { orders, loading: ordersLoading } = useRealtimeOrders(user?.id, 'runner');
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data?.role !== 'runner') {
          navigate('/login');
        } else {
          setUserRole(data.role);
        }
      }
    };
    
    checkRole();
  }, [user, navigate]);

  useEffect(() => {
    if (!user || userRole !== 'runner') return;

    // Partition orders into available and mine
    const available = (orders || []).filter(o => o.delivery_status === 'pending' && !o.runner_id) as Order[];
    const mine = (orders || []).filter(o => o.runner_id === user.id && o.delivery_status !== 'delivered') as Order[];
    setAvailableOrders(available);
    setMyDeliveries(mine);

    // Stats
    const delivered = (orders || []).filter(o => o.runner_id === user.id && o.delivery_status === 'delivered');
    setCompletedCount(delivered.length);
    setTotalEarnings(delivered.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0));
  }, [orders, user, userRole]);

  // Fetch vendor names for display
  useEffect(() => {
    const fetchVendorNames = async () => {
      const ids = Array.from(new Set((orders || []).map(o => o.vendor_id))).filter(Boolean) as string[];
      if (ids.length === 0) return;
      const { data } = await supabase.from('vendors').select('id, name').in('id', ids);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(v => (map[v.id] = v.name));
        setVendorNames(map);
      }
    };
    fetchVendorNames();
  }, [orders]);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('orders')
        .select('delivery_fee')
        .eq('runner_id', user.id)
        .eq('delivery_status', 'delivered');

      if (data) {
        setCompletedCount(data.length);
        setTotalEarnings(data.reduce((sum, order) => sum + Number(order.delivery_fee), 0));
      }
    };
    
    loadStats();
  }, [user]);

  if (loading || !user || !userRole) {
    return null;
  }

  const acceptOrder = async (orderId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('orders')
      .update({
        runner_id: user.id,
        delivery_status: 'accepted',
      })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to accept order');
      return;
    }
    
    toast.success('Order accepted! The vendor will start preparing.');
    
    // No manual refresh needed; realtime hook will update lists
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: status })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success(`Order status updated to ${status}`);
    
    // Realtime hook will update lists
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-info text-info-foreground';
      case 'preparing': return 'bg-status-preparing text-white';
      case 'delivering': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Runner Dashboard</h1>
          <p className="text-muted-foreground text-lg">Accept deliveries and start earning</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatZMW(Number(totalEarnings))}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {completedCount} deliveries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myDeliveries.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableOrders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to accept
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries */}
        {myDeliveries.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">My Active Deliveries</h2>
            <div className="space-y-4">
              {myDeliveries.map(order => {
                const vendorName = vendorNames[order.vendor_id] || 'Unknown Vendor';
                return (
                  <Card key={order.id} className="border-2 border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {vendorName}
                            <Badge className={getStatusColor(order.delivery_status)}>
                              {order.delivery_status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Order #{order.id.slice(0, 8)} · {order.items.length} items
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Delivery Fee</p>
                          <p className="text-xl font-bold text-success">{formatZMW(Number(order.delivery_fee))}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Delivery Address:</p>
                            <p className="text-muted-foreground">{order.delivery_address}</p>
                          </div>
                        </div>
                        {order.delivery_notes && (
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Notes:</p>
                              <p className="text-muted-foreground">{order.delivery_notes}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {order.delivery_status === 'accepted' && (
                          <Button
                            onClick={() => updateStatus(order.id, 'preparing')}
                            className="flex-1"
                          >
                            Mark as Preparing
                          </Button>
                        )}
                        {order.delivery_status === 'preparing' && (
                          <Button
                            onClick={() => updateStatus(order.id, 'delivering')}
                            className="flex-1"
                          >
                            Start Delivery
                          </Button>
                        )}
                        {order.delivery_status === 'delivering' && (
                          <Button
                            onClick={() => updateStatus(order.id, 'delivered')}
                            className="flex-1"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Delivery
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Orders */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Deliveries</h2>
          {availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.map(order => {
                const vendorName = vendorNames[order.vendor_id] || 'Unknown Vendor';
                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{vendorName}</CardTitle>
                          <CardDescription>
                            {order.items.length} items · Ordered {new Date(order.created_at).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">You'll earn</p>
                          <p className="text-xl font-bold text-success">{formatZMW(Number(order.delivery_fee))}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery_address}</span>
                      </div>
                      <Button
                        onClick={() => acceptOrder(order.id)}
                        className="w-full"
                      >
                        Accept Delivery
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders available right now</h3>
                <p className="text-muted-foreground">Check back soon for new delivery opportunities!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RunnerDashboard;
