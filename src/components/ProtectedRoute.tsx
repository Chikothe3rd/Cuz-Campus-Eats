import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'vendor' | 'runner';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        // Fetch all roles to avoid .single() errors when a user has multiple
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
        } else if (data && data.length > 0) {
          // Prefer first role; future enhancement: let user choose
            setUserRole(data[0].role);
        }
      } catch (error) {
        console.error('Role fetch error:', error);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Show loading while checking auth and role
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to register if no role assigned
  if (!userRole) {
    return <Navigate to="/register" replace />;
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;