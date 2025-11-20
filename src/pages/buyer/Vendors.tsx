import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Store, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const Vendors = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);
      setVendors(data || []);
    };

    fetchVendors();

    // Real-time subscription
    const channel = supabase
      .channel('vendors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => {
        fetchVendors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Browse Vendors</h1>
          <p className="text-muted-foreground text-lg">Discover amazing food from student vendors and the official cafeteria</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search vendors, cuisines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden card-hover"
                onClick={() => navigate(`/buyer/vendors/${vendor.id}`)}
              >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={vendor.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'}
                  alt={vendor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {vendor.is_cafeteria && (
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                    Official Cafeteria
                  </Badge>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-xl">{vendor.name}</h3>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold">{vendor.rating || 0}</span>
                    <span className="text-sm text-muted-foreground">/5.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{vendor.preparation_time}min</span>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {vendor.description || 'Delicious food available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{vendor.cuisine_type}</span>
                </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Vendors;
