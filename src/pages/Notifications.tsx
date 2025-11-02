import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Notifications = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // For now, show a placeholder as we don't have notifications table yet
  // This can be extended when notifications feature is fully implemented
  
  if (loading || !user) {
    return null;
  }

  const markAsRead = (notificationId: string) => {
    // TODO: Implement with Supabase notifications table
    toast.success('Notification marked as read');
  };

  const markAllAsRead = () => {
    // TODO: Implement with Supabase notifications table
    toast.success('All notifications marked as read');
  };

  const unreadCount = 0; // Will be calculated from actual notifications

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
            </p>
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <Card>
          <CardContent className="py-16 text-center">
            <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">We'll notify you when there's something new</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Notifications;
