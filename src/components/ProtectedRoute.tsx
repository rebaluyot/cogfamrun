
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: 'isAdmin' | 'canDistributeKits'; // Add more permissions as needed
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // First check if the user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a specific permission is required, check for that
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="ml-2">Access Denied</AlertTitle>
          <AlertDescription className="ml-2">
            You don't have permission to view this page. Please contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
