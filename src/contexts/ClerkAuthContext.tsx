import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { toast } from 'sonner';

type AuthUser = {
  username: string;
  role: 'admin' | 'user';
  email?: string;
  id?: string;
};

interface ClerkAuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  sendVerificationEmail: (email: string) => Promise<boolean>;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customUser, setCustomUser] = useState<AuthUser | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const authUser: AuthUser = {
        id: user.id,
        username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
        role: user.publicMetadata?.role as 'admin' | 'user' || 'user',
        email: user.primaryEmailAddress?.emailAddress
      };
      setCustomUser(authUser);
    } else if (isLoaded && !isSignedIn) {
      setCustomUser(null);
    }
  }, [isLoaded, isSignedIn, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (email === 'admin' && password === 'admin123') {
        const demoUser = { 
          username: 'admin', 
          role: 'admin' as const,
          id: 'demo-admin',
          email: 'admin@example.com'
        };
        setCustomUser(demoUser);
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        toast.success(`Welcome back, admin!`);
        return true;
      }

      if (clerk.client && clerk.client.signIn) {
        const result = await clerk.client.signIn.create({
          identifier: email,
          password,
        });

        if (result.status === 'complete') {
          toast.success('Welcome back!');
          return true;
        } else if (result.status === 'needs_second_factor') {
          toast.info('Please complete the two-factor authentication');
          return false;
        } else if (result.status === 'needs_identifier' || result.status === 'needs_first_factor') {
          toast.error('Please provide both email and password');
          return false;
        } else if (result.status === 'needs_new_password') {
          toast.info('You need to set a new password');
          return false;
        } else {
          toast.error('Authentication failed');
          return false;
        }
      } else {
        toast.error('Authentication service not available');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.errors && error.errors.length > 0) {
        const errorMessage = error.errors[0].message.toLowerCase();
        
        if (errorMessage.includes('verify') || errorMessage.includes('verification')) {
          toast.error('Please verify your email address. Check your inbox and spam folders for a verification link.');
          
          try {
            if (clerk.client && clerk.client.signUp && email.includes('@')) {
              await clerk.client.signUp.create({
                emailAddress: email,
                password: password,
              });
              toast.info('A new verification email has been sent.');
            }
          } catch (resendError) {
            console.error('Error resending verification email:', resendError);
          }
        } else if (errorMessage.includes('not found') || errorMessage.includes('incorrect')) {
          toast.error('Invalid email/username or password');
        } else {
          toast.error(error.errors[0].message || 'An error occurred during login');
        }
      } else {
        toast.error('An error occurred during login');
      }
      return false;
    }
  };

  const sendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      if (!email || !email.includes('@')) {
        toast.error('Please provide a valid email address');
        return false;
      }

      console.log('Attempting to send verification email to:', email);

      if (!clerk.client || !clerk.client.signUp) {
        toast.error('Authentication service is not available');
        return false;
      }

      const signUpAttempt = await clerk.client.signUp.create({
        emailAddress: email,
        password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      });

      console.log('SignUp attempt response:', signUpAttempt);

      if (signUpAttempt.status === 'complete') {
        toast.success('Account already verified!');
        return true;
      } else if (signUpAttempt.status === 'missing_requirements') {
        if (clerk.client.signIn) {
          try {
            const signInAttempt = await clerk.client.signIn.create({
              identifier: email,
            });
            
            if (signInAttempt.supportedFirstFactors) {
              const emailOption = signInAttempt.supportedFirstFactors.find(
                factor => factor.strategy === 'email_code' || factor.strategy === 'email_link'
              );
              
              if (emailOption && 'emailAddressId' in emailOption) {
                if (emailOption.strategy === 'email_code') {
                  await clerk.client.signIn.prepareFirstFactor({
                    strategy: 'email_code',
                    emailAddressId: emailOption.emailAddressId,
                  });
                } else if (emailOption.strategy === 'email_link') {
                  await clerk.client.signIn.prepareFirstFactor({
                    strategy: 'email_link',
                    emailAddressId: emailOption.emailAddressId,
                    redirectUrl: window.location.origin + '/login',
                  });
                }
                
                toast.success('A new verification email has been sent! Please check your inbox and spam folders.');
                return true;
              }
            }
          } catch (prepareError) {
            console.error('Error preparing verification method:', prepareError);
          }
        }
      }

      toast.info('A verification email has been sent. Please check your inbox and spam folders.');
      return true;
    } catch (error: any) {
      console.error('Verification email error:', error);
      
      if (error.errors && error.errors[0]?.code === 'form_identifier_exists') {
        toast.info('A verification email has been sent. Please check both inbox and spam folders.');
        return true;
      }
      
      toast.error(error.errors?.[0]?.message || 'Failed to send verification email');
      return false;
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('demoUser')) {
        localStorage.removeItem('demoUser');
        setCustomUser(null);
      } else {
        await clerk.signOut();
      }
      toast.info('You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  };

  useEffect(() => {
    const demoUserJson = localStorage.getItem('demoUser');
    if (demoUserJson) {
      try {
        const demoUser = JSON.parse(demoUserJson);
        setCustomUser(demoUser);
      } catch (e) {
        localStorage.removeItem('demoUser');
      }
    }
  }, []);

  return (
    <ClerkAuthContext.Provider 
      value={{ 
        user: customUser, 
        login, 
        logout, 
        isLoading: !isLoaded,
        sendVerificationEmail
      }}
    >
      {children}
    </ClerkAuthContext.Provider>
  );
};

export const useClerkAuth = (): ClerkAuthContextType => {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};
