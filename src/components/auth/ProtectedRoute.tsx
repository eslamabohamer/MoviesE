
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        console.log('ProtectedRoute - Current user:', user);
        console.log('ProtectedRoute - Admin only check:', adminOnly);
        
        if (user) {
          if (adminOnly) {
            // If this is an admin-only route, check role directly and also via is_admin_secure function
            const isAdmin = user.role === 'admin';
            console.log('ProtectedRoute - User role:', user.role, 'Is admin from role:', isAdmin);
            
            // Double-check with the database function for extra security
            if (!isAdmin) {
              try {
                const { data: isAdminFromDB, error } = await supabase.rpc('is_admin_secure');
                console.log('ProtectedRoute - Is admin from DB function:', isAdminFromDB, error);
                
                if (error) {
                  console.error('Error checking admin status:', error);
                  setHasAccess(false);
                  toast.error("Error verifying admin access");
                } else if (isAdminFromDB) {
                  console.log('ProtectedRoute - User has admin access according to DB function');
                  setHasAccess(true);
                } else {
                  console.log('ProtectedRoute - User does not have admin access according to DB function');
                  toast.error("You don't have admin access to this page");
                  setHasAccess(false);
                }
              } catch (error) {
                console.error('Exception checking admin status:', error);
                setHasAccess(false);
                toast.error("Error verifying admin access");
              }
            } else {
              // User has admin role directly in auth context
              setHasAccess(true);
            }
          } else {
            // Not an admin-only route, any authenticated user has access
            setHasAccess(true);
          }
        }
        
        setAccessChecked(true);
      }
    };
    
    checkAccess();
  }, [user, isLoading, adminOnly]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (accessChecked && !hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
