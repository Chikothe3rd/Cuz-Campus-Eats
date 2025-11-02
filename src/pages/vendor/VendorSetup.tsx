import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Store, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/Layout';

const VendorSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine_type: '',
    image_url: '',
    preparation_time: 30,
    is_cafeteria: false,
  });

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

      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
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
    
    if (!user) {
      toast.error('You must be logged in to set up a vendor profile');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Check if vendor profile already exists
      const { data: existing } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.error('You already have a vendor profile');
        navigate('/vendor');
        return;
      }

      // Create vendor profile
      const { error } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          cuisine_type: formData.cuisine_type,
          image_url: formData.image_url || null,
          preparation_time: formData.preparation_time,
          is_cafeteria: formData.is_cafeteria,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Vendor profile created successfully!');
      navigate('/vendor');
    } catch (error: any) {
      console.error('Vendor setup error:', error);
      toast.error(error.message || 'Failed to create vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const cuisineTypes = [
    'American',
    'Asian',
    'Bakery',
    'BBQ',
    'Beverages',
    'Breakfast',
    'Burgers',
    'Chinese',
    'Coffee & Tea',
    'Desserts',
    'Fast Food',
    'Healthy',
    'Indian',
    'Italian',
    'Japanese',
    'Korean',
    'Mediterranean',
    'Mexican',
    'Pizza',
    'Salads',
    'Sandwiches',
    'Seafood',
    'Thai',
    'Vegan',
    'Vegetarian',
    'Other',
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/vendor')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Set Up Your Vendor Profile</h1>
          </div>
          <p className="text-muted-foreground">
            Complete your profile to start selling on Campus Eats
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>
              Tell students about your food business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Joe's Burgers, Sarah's Smoothies"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  This is how customers will see your business
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers what makes your food special..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Cuisine Type *</Label>
                <Select
                  value={formData.cuisine_type}
                  onValueChange={(value) => setFormData({ ...formData, cuisine_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Business Image (Optional)</Label>
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border mb-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview('');
                        setFormData({ ...formData, image_url: '' });
                      }}
                    >
                      <span className="text-lg">×</span>
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
                <p className="text-xs text-muted-foreground">
                  Upload a logo or photo of your food (max 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparation_time">
                  Average Preparation Time (minutes) *
                </Label>
                <Input
                  id="preparation_time"
                  type="number"
                  min="5"
                  max="120"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How long does it typically take to prepare an order?
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_cafeteria" className="cursor-pointer">
                    Cafeteria/Food Court Vendor
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Are you operating from a campus cafeteria or food court?
                  </p>
                </div>
                <Switch
                  id="is_cafeteria"
                  checked={formData.is_cafeteria}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_cafeteria: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/vendor')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating Profile...' : 'Create Vendor Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VendorSetup;
