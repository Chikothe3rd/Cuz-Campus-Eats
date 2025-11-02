import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { supabase } from '@/integrations/supabase/client';
import { formatZMW } from '@/lib/utils';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading } = useRealtimeOrders(user?.id, 'buyer');
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchVendorNames = async () => {
      const vendorIds = [...new Set(orders.map(o => o.vendor_id))];
      const { data } = await supabase
        .from('vendors')
        .select('id, name')
        .in('id', vendorIds);
      
      if (data) {
        const names: Record<string, string> = {};
        data.forEach(v => names[v.id] = v.name);
        setVendorNames(names);
      }
    };

    if (orders.length > 0) {
      fetchVendorNames();
    }
  }, [orders]);

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'accepted': return 'bg-info text-info-foreground';
      case 'preparing': return 'bg-status-preparing text-white';
      case 'delivering': return 'bg-accent text-accent-foreground';
      case 'delivered': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return <Clock className="h-5 w-5" />;
      case 'preparing':
      case 'delivering':
        return <MapPin className="h-5 w-5" />;
      case 'delivered':
        return <Package className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const activeOrders = orders.filter(o => o.delivery_status !== 'delivered' && o.delivery_status !== 'cancelled');
  const pastOrders = orders.filter(o => o.delivery_status === 'delivered' || o.delivery_status === 'cancelled');

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track your current and past orders</p>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Active Orders</h2>
            <div className="space-y-4">
              {activeOrders.map(order => {
                const items = order.items as any[];
                return (
                  <Card
                    key={order.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/buyer/orders/${order.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-full ${getStatusColor(order.delivery_status)} flex items-center justify-center`}>
                            {getStatusIcon(order.delivery_status)}
                          </div>
                          <div>
                            <CardTitle>{vendorNames[order.vendor_id] || 'Vendor'}</CardTitle>
                            <CardDescription>
                              {items.length} item{items.length > 1 ? 's' : ''} · Ordered {format(new Date(order.created_at), 'MMM d, h:mm a')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.delivery_status)}>
                            {order.delivery_status}
                          </Badge>
                          <p className="text-lg font-bold mt-2">{formatZMW(Number(order.total))}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {order.delivery_address}
                          </p>
                          {order.estimated_delivery_at && (
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Est. delivery: {format(new Date(order.estimated_delivery_at), 'h:mm a')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Orders</h2>
            <div className="space-y-4">
              {pastOrders.map(order => {
                const items = order.items as any[];
                return (
                  <Card
                    key={order.id}
                    className="hover:shadow-md transition-shadow cursor-pointer opacity-75"
                    onClick={() => navigate(`/buyer/orders/${order.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{vendorNames[order.vendor_id] || 'Vendor'}</CardTitle>
                          <CardDescription>
                            {items.length} item{items.length > 1 ? 's' : ''} · {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.delivery_status)} variant="outline">
                            {order.delivery_status}
                          </Badge>
                          <p className="font-semibold mt-2">{formatZMW(Number(order.total))}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start ordering from your favorite vendors!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
