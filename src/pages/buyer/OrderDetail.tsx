import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, MapPin, Clock, CreditCard, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';
import { formatZMW } from '@/lib/utils';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  type OrderRow = Database['public']['Tables']['orders']['Row'] & { vendors?: { name: string; cuisine_type: string | null } };
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [role, setRole] = useState<string>('buyer');

  useEffect(() => {
    const fetch = async () => {
      if (!orderId) return;
      // Determine current user's role for back navigation
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        if (userRole?.role) setRole(userRole.role);
      }

      const { data } = await supabase
        .from('orders')
        .select('*, vendors(name, cuisine_type)')
        .eq('id', orderId)
        .single();
      setOrder(data || null);
    };

    fetch();

    // subscribe to realtime updates for this order
    const channel = supabase
      .channel('order-detail-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, () => {
        supabase
          .from('orders')
          .select('*, vendors(name, cuisine_type)')
          .eq('id', orderId)
          .single()
          .then(({ data }) => setOrder(data || null));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user]);

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
          <Button onClick={() => navigate(`/${role}/orders`)} className="mt-4">
            Back to Orders
          </Button>
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

  const getProgressSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Placed', time: order.created_at },
      { status: 'accepted', label: 'Runner Assigned', time: null },
      { status: 'preparing', label: 'Preparing Food', time: null },
      { status: 'delivering', label: 'Out for Delivery', time: null },
      { status: 'delivered', label: 'Delivered', time: null },
    ];

    const currentIndex = steps.findIndex(s => s.status === order.delivery_status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const progressSteps = getProgressSteps();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/${role}/orders`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Order #{order.id.slice(0, 8)}</CardTitle>
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

        {/* Order Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressSteps.map((step, index) => (
                <div key={step.status} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.completed ? '✓' : index + 1}
                    </div>
                    {index < progressSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          step.completed ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className={`font-medium ${step.active ? 'text-primary' : ''}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(step.time), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {(order.items as unknown as Array<{ name: string; price: number; quantity: number }>).map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatZMW(Number(item.price))}
                      </p>
                    </div>
                    <p className="font-semibold">{formatZMW(Number(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatZMW(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatZMW(Number(order.tax))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatZMW(Number(order.delivery_fee))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatZMW(Number(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.vendors?.name || 'Vendor'}</p>
                    {order.vendors?.cuisine_type && (
                      <p className="text-sm text-muted-foreground">{order.vendors.cuisine_type}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
                {order.delivery_notes && (
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery Notes</p>
                      <p className="text-sm text-muted-foreground">{order.delivery_notes}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {order.estimated_delivery_at ? format(new Date(order.estimated_delivery_at), 'h:mm a') : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.payment_method}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Payment Status</p>
                    <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetail;
