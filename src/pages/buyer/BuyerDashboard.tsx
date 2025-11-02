import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Clock, Star, Package, ChevronRight, ShoppingCart, RotateCcw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatZMW } from '@/lib/utils';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
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
          // Fetch all data in parallel
          const [profileRes, vendorsRes, ordersRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('vendors').select('*').eq('is_active', true).order('rating', { ascending: false }),
            supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(3)
          ]);

          setProfile(profileRes.data);
          setVendors(vendorsRes.data || []);
          setRecentOrders(ordersRes.data || []);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Real-time subscription for orders
    if (user) {
      const channel = supabase
        .channel('buyer-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`
        }, () => {
          // Refresh orders
          supabase.from('orders')
            .select('*')
            .eq('buyer_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)
            .then(({ data }) => setRecentOrders(data || []));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: 'cancelled' })
      .eq('id', orderId)
      .eq('buyer_id', user?.id);

    if (error) {
      toast.error('Failed to cancel order');
    } else {
      toast.success('Order cancelled successfully');
      setRecentOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, delivery_status: 'cancelled' } : o
      ));
    }
  };

  const reorder = async (order: any) => {
    toast.success('Items added to cart!');
    navigate('/buyer/cart');
  };

  if (loading || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return null;
  }

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
        {/* Welcome Section */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome, {profile.name}!</h1>
          <p className="text-muted-foreground text-lg">What are you craving today?</p>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Track your latest food orders</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => navigate('/buyer/orders')}>
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg hover:bg-card-hover transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/buyer/orders/${order.id}`)}>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatZMW(Number(order.total))}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.delivery_status)}>
                        {order.delivery_status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {order.delivery_status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelOrder(order.id);
                          }}
                          className="flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {order.delivery_status === 'delivered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            reorder(order);
                          }}
                          className="flex-1"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reorder
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/buyer/orders/${order.id}`)}
                        className="flex-1"
                      >
                        View Details
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendors Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse Vendors</h2>
            <Button variant="outline" onClick={() => navigate('/buyer/vendors')}>
              View All Vendors
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <Card
                key={vendor.id}
                className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                onClick={() => navigate(`/buyer/vendors/${vendor.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={vendor.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {vendor.is_cafeteria && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                      Official
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {vendor.name}
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span>{vendor.rating}</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {vendor.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Store className="h-4 w-4" />
                      <span>{vendor.cuisine_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{vendor.preparation_time || 30}min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/buyer/vendors')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Browse All Vendors</CardTitle>
              <CardDescription>Explore more food options</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/buyer/orders')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">My Orders</CardTitle>
              <CardDescription>Track your order history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/buyer/cart')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-success" />
              </div>
              <CardTitle className="text-lg">View Cart</CardTitle>
              <CardDescription>Complete your purchase</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
