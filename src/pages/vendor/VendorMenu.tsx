import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Pencil, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatZMW } from '@/lib/utils';

const categories = ['Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Side Dish'];

const VendorMenu = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    preparation_time: '15',
    is_available: true,
    image_url: ''
  });

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
          
          if (!vendorData) {
            navigate('/vendor/setup');
            return;
          }

          setVendor(vendorData);
          
          const { data: menuData } = await supabase
            .from('menu_items')
            .select('*')
            .eq('vendor_id', vendorData.id)
            .order('category', { ascending: true });

          setMenuItems(menuData || []);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    const itemData = {
      vendor_id: vendor.id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      preparation_time: parseInt(formData.preparation_time),
      is_available: formData.is_available,
      image_url: formData.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
    };

    if (editingItem) {
      const { error } = await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Failed to update item');
      } else {
        toast.success('Menu item updated');
        setMenuItems(prev => prev.map(item => 
          item.id === editingItem.id ? { ...item, ...itemData } : item
        ));
        closeDialog();
      }
    } else {
      const { error, data } = await supabase
        .from('menu_items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        toast.error('Failed to add item');
      } else {
        toast.success('Menu item added');
        setMenuItems(prev => [...prev, data]);
        closeDialog();
      }
    }
  };

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Menu item deleted');
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const openDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category,
        preparation_time: item.preparation_time.toString(),
        is_available: item.is_available,
        image_url: item.image_url || ''
      });
      setImagePreview(item.image_url || '');
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        preparation_time: '15',
        is_available: true,
        image_url: ''
      });
      setImagePreview('');
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setImagePreview('');
  };

  if (loading || !user) return null;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = menuItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vendor')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Manage Menu</h1>
              <p className="text-muted-foreground text-lg">{vendor?.name}</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the details of this menu item' : 'Add a new item to your menu'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="image">Item Image</Label>
                  <div className="mt-2 space-y-4">
                    {imagePreview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="prep_time">Prep Time (minutes) *</Label>
                    <Input
                      id="prep_time"
                      type="number"
                      min="1"
                      value={formData.preparation_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="available">Available for order</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {menuItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-xl text-muted-foreground mb-4">No menu items yet</p>
              <p className="text-sm text-muted-foreground mb-6">Add your first item to get started</p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const items = groupedItems[category];
              if (items.length === 0) return null;

              return (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-4">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                      <Card key={item.id}>
                        <CardHeader className="p-0">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                            alt={item.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <Badge variant={item.is_available ? 'default' : 'secondary'}>
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                          {item.description && (
                            <CardDescription className="line-clamp-2 mb-3">
                              {item.description}
                            </CardDescription>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold">{formatZMW(Number(item.price))}</span>
                            <span className="text-sm text-muted-foreground">{item.preparation_time} min</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openDialog(item)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VendorMenu;
