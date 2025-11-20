import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cartStorage } from '@/lib/storage';
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const VendorMenu = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<Array<{ itemId: string; quantity: number }>>(cartStorage.get());

  useEffect(() => {
    const fetchVendorAndMenu = async () => {
      if (!vendorId) return;
      
      setIsLoading(true);
      try {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .eq('is_active', true)
          .single();
        
        setVendor(vendorData);

        if (vendorData) {
          const { data: menuData } = await supabase
            .from('menu_items')
            .select('*')
            .eq('vendor_id', vendorId)
            .eq('is_available', true);
          
          setMenuItems(menuData || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorAndMenu();
  }, [vendorId]);

  useEffect(() => {
    cartStorage.set(cart);
  }, [cart]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-8">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vendor not found</p>
          <Button onClick={() => navigate('/buyer/vendors')} className="mt-4">
            Back to Vendors
          </Button>
        </div>
      </Layout>
    );
  }

  const getItemQuantity = (itemId: string) => {
    return cart.find(item => item.itemId === itemId)?.quantity || 0;
  };

  const addToCart = (itemId: string, itemName: string) => {
    // Check if item is still available
    const menuItem = menuItems.find(item => item.id === itemId);
    if (!menuItem || !menuItem.is_available) {
      toast.error('This item is no longer available');
      return;
    }
    
    const existingItem = cart.find(item => item.itemId === itemId);
    if (existingItem) {
      setCart(cart.map(item =>
        item.itemId === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { itemId, quantity: 1 }]);
    }
    toast.success(`Added ${itemName} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find(item => item.itemId === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.itemId === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.itemId !== itemId));
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Group menu items by category
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

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
          onClick={() => navigate('/buyer/vendors')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vendors
        </Button>

        {/* Vendor Header */}
        <div className="relative h-64 rounded-xl overflow-hidden">
          <img
            src={vendor.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{vendor.name}</h1>
              {vendor.is_cafeteria && (
                <Badge className="bg-white/20 text-white backdrop-blur-sm">
                  Official
                </Badge>
              )}
            </div>
            <p className="text-lg mb-3">{vendor.description}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="font-semibold">{vendor.rating || 0}/5.0</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{vendor.preparation_time} min prep time</span>
              </div>
              <Badge className="bg-white/20 backdrop-blur-sm">{vendor.cuisine_type}</Badge>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        {menuItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-xl text-muted-foreground mb-4">No menu items available yet</p>
              <p className="text-sm text-muted-foreground">This vendor hasn't added any items to their menu</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => item.category === category);
              return (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-4">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryItems.map((item, index) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="overflow-hidden hover:shadow-lg transition-shadow card-hover">
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-black/60 text-white backdrop-blur-sm">
                                ${Number(item.price).toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                          <CardHeader>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{item.preparation_time}min</span>
                              </div>
                              {quantity === 0 ? (
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item.id, item.name)}
                                >
                                  <Plus className="mr-1 h-4 w-4" />
                                  Add
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-semibold w-8 text-center">{quantity}</span>
                                  <Button
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => addToCart(item.id, item.name)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Cart Button */}
        {totalItems > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="lg"
              onClick={() => navigate('/buyer/cart')}
              className="shadow-lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              View Cart ({totalItems})
            </Button>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default VendorMenu;
