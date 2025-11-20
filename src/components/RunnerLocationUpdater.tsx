import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RunnerLocationUpdaterProps {
  orderId: string;
  orderStatus: string;
}

const RunnerLocationUpdater = ({ orderId, orderStatus }: RunnerLocationUpdaterProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const updateLocation = async (lat: number, lng: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          runner_lat: lat,
          runner_lng: lng,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get location. Please enable location services.');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success('Location tracking started');
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.info('Location tracking stopped');
    }
  };

  useEffect(() => {
    // Auto-stop tracking when order is delivered
    if (orderStatus === 'delivered' && isTracking) {
      stopTracking();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [orderStatus]);

  if (orderStatus !== 'delivering') {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Location Tracking
        </CardTitle>
        <CardDescription>
          Enable real-time location updates for the customer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isTracking ? 'default' : 'secondary'}>
              {isTracking ? 'Tracking Active' : 'Not Tracking'}
            </Badge>
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            onClick={isTracking ? stopTracking : startTracking}
            variant={isTracking ? 'destructive' : 'default'}
            size="sm"
          >
            <MapPin className="mr-2 h-4 w-4" />
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
        </div>
        
        {isTracking && (
          <div className="p-3 bg-primary/5 rounded-md">
            <p className="text-sm text-muted-foreground">
              📍 Your location is being shared with the customer in real-time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RunnerLocationUpdater;
