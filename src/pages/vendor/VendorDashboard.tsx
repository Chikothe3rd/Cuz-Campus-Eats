import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, DollarSign, Package, TrendingUp, MapPin, Check, X, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatZMW } from '@/lib/utils';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          setVendor(vendorData);
          
          if (vendorData) {
            const [ordersRes, menuRes] = await Promise.all([
              supabase.from('orders').select('*').eq('vendor_id', vendorData.id).order('created_at', { ascending: false }),
              supabase.from('menu_items').select('*').eq('vendor_id', vendorData.id)
            ]);

            setOrders(ordersRes.data || []);
            setMenuItems(menuRes.data || []);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Real-time subscription
    if (user) {
      supabase.from('vendors').select('*').eq('user_id', user.id).single().then(({ data: vendorData }) => {
        if (vendorData) {
          const channel = supabase
            .channel('vendor-orders')
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `vendor_id=eq.${vendorData.id}`
            }, () => {
              supabase.from('orders')
                .select('*')
                .eq('vendor_id', vendorData.id)
                .order('created_at', { ascending: false })
                .then(({ data }) => setOrders(data || []));
            })
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      });
    }
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: status })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
    } else {
      toast.success(`Order ${status}`);
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, delivery_status: status } : o
      ));
    }
  };

  if (loading || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="text-center py-16">
          <Store className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Vendor Profile Not Set Up</h2>
          <p className="text-muted-foreground mb-6">You need to create your vendor profile first</p>
          <Button onClick={() => navigate('/vendor/setup')}>
            Set Up Vendor Profile
          </Button>
        </div>
      </Layout>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'delivering'].includes(o.delivery_status));
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'accepted': return 'bg-info text-info-foreground';
      case 'preparing': return 'bg-status-preparing text-white';
      case 'delivering': return 'bg-accent text-accent-foreground';
      case 'delivered': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{vendor.name}</h1>
            <p className="text-muted-foreground text-lg">Manage your orders and menu</p>
          </div>
          <Button onClick={() => navigate('/vendor/menu')}>
            Manage Menu
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatZMW(Number(totalRevenue))}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {completedOrders.length} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Menu Items</CardTitle>
              <Store className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{menuItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendor.rating}/5</div>
              <p className="text-xs text-muted-foreground mt-1">
                Customer satisfaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Orders</h2>
          {activeOrders.length > 0 ? (
            <div className="space-y-4">
              {activeOrders.map(order => (
                <Card key={order.id} className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Order #{order.id.slice(0, 8)}
                          <Badge className={getStatusColor(order.delivery_status)}>
                            {order.delivery_status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Order · {format(new Date(order.created_at), 'h:mm a')}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Order Total</p>
                        <p className="text-xl font-bold">{formatZMW(Number(order.subtotal))}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Items:</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-muted-foreground">{formatZMW(Number(item.price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Info */}
                    <div className="space-y-2 text-sm pt-2 border-t">
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

                    {/* Action Buttons */}
                    <div className="pt-2 flex gap-2">
                      {order.delivery_status === 'pending' && !order.runner_id && (
                        <p className="text-sm text-muted-foreground">Waiting for runner...</p>
                      )}
                      {order.delivery_status === 'accepted' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Start Preparing
                        </Button>
                      )}
                      {order.delivery_status === 'preparing' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'delivering')}
                          variant="secondary"
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Ready for Pickup
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No active orders</h3>
                <p className="text-muted-foreground">New orders will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Completed Orders</h2>
            <div className="space-y-3">
              {completedOrders.slice(0, 5).map(order => (
                <Card key={order.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription className="text-sm">
                          {format(new Date(order.created_at), 'MMM d, h:mm a')}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-success text-success-foreground" variant="outline">
                          Delivered
                        </Badge>
                        <p className="text-sm font-semibold mt-1">{formatZMW(Number(order.subtotal))}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VendorDashboard;
