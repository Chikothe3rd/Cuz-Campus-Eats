import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'vendor' | 'runner';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, role, roleLoading } = useAuth();

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
  if (!role) {
    return <Navigate to="/register" replace />;
  }

  // Check role-based access
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={`/${role}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;