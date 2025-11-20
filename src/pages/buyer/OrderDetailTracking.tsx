import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, MapPin, Clock, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OrderTrackingMap from '@/components/OrderTrackingMap';
import RunnerLocationUpdater from '@/components/RunnerLocationUpdater';
import { useAuth } from '@/hooks/useAuth';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { motion, AnimatePresence } from 'framer-motion';

const OrderDetailTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const { location } = useOrderTracking(orderId || '');

  useEffect(() => {
    const fetchOrderAndRole = async () => {
      if (!orderId || !user) return;

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }

      // Fetch order details
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:vendors(name, image_url, cuisine_type),
          buyer:profiles!orders_buyer_id_fkey(name, email),
          runner:profiles!orders_runner_id_fkey(name, email)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        return;
      }

      setOrder(orderData);
    };

    fetchOrderAndRole();
  }, [orderId, user]);

  if (!order || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </Layout>
    );
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

  const calculateETA = () => {
    if (!location?.runner_lat || !location?.runner_lng || !location?.delivery_lat || !location?.delivery_lng) {
      return 'Calculating...';
    }

    // Simple distance calculation (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = (location.delivery_lat - location.runner_lat) * Math.PI / 180;
    const dLng = (location.delivery_lng - location.runner_lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location.runner_lat * Math.PI / 180) * Math.cos(location.delivery_lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Estimate time (assuming average speed of 20 km/h)
    const estimatedMinutes = Math.ceil((distance / 20) * 60);
    return estimatedMinutes > 0 ? `${estimatedMinutes} min` : 'Arriving soon';
  };

  return (
    <Layout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/${userRole}/orders`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Placed on {format(new Date(order.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <Badge className={`${getStatusColor(order.delivery_status)} text-lg px-4 py-2`}>
                {order.delivery_status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Live Tracking Map */}
        <AnimatePresence mode="wait">
          {(order.delivery_status === 'delivering' || order.delivery_status === 'delivered') && 
           location?.delivery_lat && location?.delivery_lng && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Live Tracking
                    </CardTitle>
                    {order.delivery_status === 'delivering' && location?.runner_lat && (
                      <Badge variant="default" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        ETA: {calculateETA()}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <OrderTrackingMap
                    orderId={order.id}
                    deliveryLat={location.delivery_lat}
                    deliveryLng={location.delivery_lng}
                    runnerLat={location.runner_lat || undefined}
                    runnerLng={location.runner_lng || undefined}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Runner Location Updater (only for runners) */}
        {userRole === 'runner' && (
          <RunnerLocationUpdater 
            orderId={order.id} 
            orderStatus={order.delivery_status}
          />
        )}

        {/* Order Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator />
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>${order.delivery_fee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.delivery_address}</p>
                {order.delivery_notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: {order.delivery_notes}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                    {order.payment_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default OrderDetailTracking;
