import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cartStorage } from '@/lib/storage';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DeliveryMap from '@/components/DeliveryMap';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(cartStorage.get());
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [vendorGroups, setVendorGroups] = useState<any>({});
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

  const loadCart = async () => {
    const items = await Promise.all(
      cart.map(async (cartItem) => {
        const { data: menuItem } = await supabase
          .from('menu_items')
          .select('*, vendors(*)')
          .eq('id', cartItem.itemId)
          .eq('is_available', true)  // Only include available items
          .single();
        
        return menuItem ? { ...menuItem, quantity: cartItem.quantity } : null;
      })
    );

    const filtered = items.filter(Boolean);
    
    // Remove unavailable items from cart
    const availableCartItems = cart.filter(cartItem => 
      filtered.some(item => item?.id === cartItem.itemId)
    );
    
    if (availableCartItems.length !== cart.length) {
      setCart(availableCartItems);
      cartStorage.set(availableCartItems);
      toast.info('Some items were removed as they are no longer available');
    }
    
    setCartItems(filtered);

    // Group by vendor
    const groups = filtered.reduce((acc: any, item: any) => {
      if (!acc[item.vendor_id]) {
        acc[item.vendor_id] = {
          vendor: item.vendors,
          items: [],
        };
      }
      acc[item.vendor_id].items.push(item);
      return acc;
    }, {});

    setVendorGroups(groups);
  };    loadCart();
  }, [cart, user, navigate]);

  const updateQuantity = (itemId: string, change: number) => {
    const newCart = cart.map(item =>
      item.itemId === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(newCart);
    cartStorage.set(newCart);
  };

  const removeItem = (itemId: string) => {
    const newCart = cart.filter(item => item.itemId !== itemId);
    setCart(newCart);
    cartStorage.set(newCart);
    toast.success('Item removed from cart');
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax
    const deliveryFee = 2.99;
    const total = subtotal + tax + deliveryFee;
    return { subtotal, tax, deliveryFee, total };
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please select a delivery location on the map');
      return;
    }

    if (!deliveryLat || !deliveryLng) {
      toast.error('Please select a valid location on the map');
      return;
    }

    // Validate minimum order amount
    const allTotals = calculateTotals(cartItems);
    if (allTotals.subtotal < 5.00) {
      toast.error('Minimum order amount is $5.00');
      return;
    }

    setIsProcessing(true);

    try {
      // Verify all vendors are still active
      const vendorIds = Object.keys(vendorGroups);
      const { data: activeVendors } = await supabase
        .from('vendors')
        .select('id, is_active')
        .in('id', vendorIds);
      
      const inactiveVendors = vendorIds.filter(id => 
        !activeVendors?.find(v => v.id === id && v.is_active)
      );
      
      if (inactiveVendors.length > 0) {
        toast.error('Some vendors are no longer available. Please refresh your cart.');
        return;
      }

      // Create separate orders for each vendor
      const orderPromises = Object.values(vendorGroups).map(async (group) => {
        const { vendor, items } = group as any;
        const totals = calculateTotals(items);

        const { error } = await supabase.from('orders').insert({
          buyer_id: user!.id,
          vendor_id: vendor.id,
          items: items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal: totals.subtotal,
          tax: totals.tax,
          delivery_fee: totals.deliveryFee,
          total: totals.total,
          payment_status: 'pending',
          payment_method: paymentMethod,
          delivery_status: 'pending',
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
          delivery_notes: deliveryNotes || null,
          estimated_delivery_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        });

        if (error) throw error;
      });

      await Promise.all(orderPromises);

      // Clear cart
      cartStorage.clear();
      setCart([]);
      
      toast.success('Order placed successfully!');
      navigate('/buyer/orders');
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (error?.message?.includes('violates foreign key constraint')) {
        toast.error('Some items are no longer available. Please refresh your cart.');
      } else if (error?.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="text-center py-16">
          <ShoppingCart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some delicious food to get started!</p>
          <Button onClick={() => navigate('/buyer/vendors')}>
            Browse Vendors
          </Button>
        </div>
      </Layout>
    );
  }

  const allTotals = calculateTotals(cartItems);

  return (
    <Layout>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground">Review your items and proceed to checkout</p>
          </div>

          {Object.values(vendorGroups).map((group: any) => {
            const { vendor, items } = group;
            const vendorTotals = calculateTotals(items);

            return (
              <Card key={vendor.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{vendor.name}</span>
                    <span className="text-base font-normal text-muted-foreground">
                      ${vendorTotals.total.toFixed(2)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checkout Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Delivery Location</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {showMap ? 'Hide Map' : 'Select on Map'}
                  </Button>
                </div>
                
                {showMap && (
                  <div className="h-[300px] mt-2">
                    <DeliveryMap
                      onLocationSelect={(address, lat, lng) => {
                        setDeliveryAddress(address);
                        setDeliveryLat(lat);
                        setDeliveryLng(lng);
                        toast.success('Location selected');
                      }}
                    />
                  </div>
                )}
                
                <Input
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Select location on map or type address"
                  readOnly={showMap}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Any special instructions?"
                  rows={3}
                />
              </div>

               <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/5">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer flex-1">
                      💵 Cash on Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/5">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="cursor-pointer flex-1">
                      💳 Card (Simulated)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${allTotals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>${allTotals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>${allTotals.deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${allTotals.total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
