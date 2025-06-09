
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  isAdmin: boolean;
  canDistributeKits: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: keyof UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem('adminAuthenticated');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      
      if (savedRole) {
        try {
          setUserRole(JSON.parse(savedRole));
        } catch (e) {
          // If JSON parse fails, set default role
          setUserRole({ isAdmin: false, canDistributeKits: false });
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return false;
      }

      // Determine user roles and permissions
      const role: UserRole = {
        isAdmin: data.is_admin === true,
        canDistributeKits: data.can_distribute_kits === true || data.is_admin === true
      };

      setIsAuthenticated(true);
      setUserRole(role);
      
      // Save to localStorage
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('userRole', JSON.stringify(role));
      
      toast({
        title: "Login Successful",
        description: `Welcome ${role.isAdmin ? 'admin' : 'user'}`,
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('userRole');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };
  
  // Helper function to check permissions
  const hasPermission = (permission: keyof UserRole): boolean => {
    if (!isAuthenticated || !userRole) return false;
    return userRole[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRole, 
      login, 
      logout, 
      loading, 
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
