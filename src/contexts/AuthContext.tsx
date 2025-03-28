import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AuthUser = {
  username: string;
  role: 'admin' | 'user';
  email?: string;
  id?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the current app URL for redirection
const getRedirectURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'http://localhost:8080';
};

// List of known admin emails (lowercase for case-insensitive comparison)
const ADMIN_EMAILS = ['admin@example.com', 'fb74075d6b@emaily.pro', 'be8194c628@emaily.pro'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle auth URL params on initial load
  useEffect(() => {
    const handleAuthRedirects = async () => {
      const url = new URL(window.location.href);
      // Check for email confirmation token
      const token = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');
      
      if (token && type === 'email_confirmation') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup', // Using the correct type for email verification
          });
          
          if (error) {
            toast.error(`Verification failed: ${error.message}`);
          } else {
            toast.success('Email verified successfully! You can now sign in.');
            // Redirect to login page after successful verification
            window.location.href = '/login';
          }
        } catch (err) {
          console.error('Error verifying email:', err);
          toast.error('Failed to verify your email. Please try again.');
        }
      }
    };
    
    handleAuthRedirects();
  }, []);

  // Check for existing session and set up auth listener
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        if (mounted) {
          setSession(newSession);
        }
        
        if (newSession?.user && mounted) {
          // Use setTimeout to prevent potential auth deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              // First check if email is in the admin list
              const email = newSession.user.email?.toLowerCase();
              
              if (email && ADMIN_EMAILS.includes(email)) {
                console.log('Setting admin role for known admin email:', email);
                setUser({
                  id: newSession.user.id,
                  username: email.split('@')[0] || 'admin',
                  role: 'admin',
                  email: email
                });
                return;
              }
              
              // If not a predefined admin, try to fetch user data
              try {
                const { data, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', newSession.user.id)
                  .single();
                
                if (error) {
                  console.error('Error fetching user data:', error);
                  // Default to basic user info
                  setUser({
                    id: newSession.user.id,
                    username: newSession.user.email?.split('@')[0] || 'user',
                    role: 'user',
                    email: newSession.user.email
                  });
                  return;
                }
                
                if (data) {
                  console.log('User data from database:', data);
                  
                  // Explicitly check for admin role
                  const userRole = (data.role === 'admin') ? 'admin' : 'user';
                  console.log('Setting user role to:', userRole);
                  
                  setUser({
                    id: data.id,
                    username: data.username || data.email?.split('@')[0] || 'user',
                    role: userRole,
                    email: data.email
                  });
                }
              } catch (error) {
                console.error('Failed to fetch user data:', error);
                // Fallback to default user
                setUser({
                  id: newSession.user.id,
                  username: newSession.user.email?.split('@')[0] || 'user',
                  role: 'user',
                  email: newSession.user.email
                });
              }
            } catch (error) {
              console.error('Failed to process user session:', error);
              setUser({
                id: newSession.user.id,
                username: newSession.user.email?.split('@')[0] || 'user',
                role: 'user',
                email: newSession.user.email
              });
            }
          }, 0);
        } else if (mounted) {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      setSession(existingSession);
      
      if (existingSession?.user) {
        // Check for admin emails first
        const email = existingSession.user.email?.toLowerCase();
        
        if (email && ADMIN_EMAILS.includes(email)) {
          console.log('Setting admin role for known admin email:', email);
          setUser({
            id: existingSession.user.id,
            username: email.split('@')[0] || 'admin',
            role: 'admin',
            email: email
          });
          setIsLoading(false);
          return;
        }
        
        // Otherwise fetch from database
        const getUserData = async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', existingSession.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching user data:', error);
              // Default to basic user info
              setUser({
                id: existingSession.user.id,
                username: existingSession.user.email?.split('@')[0] || 'user',
                role: 'user',
                email: existingSession.user.email
              });
              setIsLoading(false);
              return;
            }
            
            if (data) {
              console.log('Initial user data from database:', data);
              
              // Explicitly check for admin role
              const userRole = (data.role === 'admin') ? 'admin' : 'user';
              console.log('Setting user role to:', userRole);
              
              setUser({
                id: data.id,
                username: data.username || data.email?.split('@')[0] || 'user',
                role: userRole,
                email: data.email
              });
            }
            
            setIsLoading(false);
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            // Fallback to default user
            setUser({
              id: existingSession.user.id,
              username: existingSession.user.email?.split('@')[0] || 'user',
              role: 'user',
              email: existingSession.user.email
            });
            setIsLoading(false);
          }
        };
        
        getUserData();
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For the demo admin account, use a special handler
      if (email === 'admin' && password === 'admin123') {
        // For demo purposes, use the local storage for admin
        const adminUser = {
          id: 'admin-demo-id',
          username: 'admin',
          role: 'admin' as const,
          email: 'admin@example.com'
        };
        
        setUser(adminUser);
        localStorage.setItem('demoAdminUser', JSON.stringify(adminUser));
        toast.success(`Welcome back, admin!`);
        return true;
      }
      
      // Try Supabase authentication for regular users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Check for email verification error
        if (error.message?.includes('Email not confirmed')) {
          throw new Error('Email not confirmed. Please check your inbox for the verification link.');
        }
        
        toast.error(error.message || 'Invalid credentials');
        return false;
      }
      
      if (data.user) {
        toast.success(`Welcome back!`);
        return true;
      }
      
      return false;
    } catch (e: any) {
      console.error("Login error:", e);
      throw e;
    }
  };

  const logout = async () => {
    // Check if it's the demo admin
    if (localStorage.getItem('demoAdminUser')) {
      localStorage.removeItem('demoAdminUser');
      setUser(null);
      setSession(null);
      toast.info('You have been logged out');
      return;
    }
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local state
    setUser(null);
    setSession(null);
    localStorage.removeItem('authUser');
    toast.info('You have been logged out');
  };

  // Check for demo admin user in local storage on mount
  useEffect(() => {
    const demoAdminJson = localStorage.getItem('demoAdminUser');
    if (demoAdminJson && !user) {
      try {
        const adminUser = JSON.parse(demoAdminJson);
        console.log('Setting demo admin user from local storage:', adminUser);
        setUser(adminUser);
      } catch (e) {
        localStorage.removeItem('demoAdminUser');
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
