import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, KeyRound, AlertTriangle, User, RefreshCw, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const Login = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const [forgotEmail, setForgotEmail] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  const { login, user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error && errorDescription) {
      toast.error(`Verification error: ${errorDescription}`);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        setVerificationEmail(email);
        setShowVerificationDialog(true);
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsSigningUp(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            username: signupUsername || signupEmail.split('@')[0]
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) {
        throw authError;
      }
      
      if (authData.user) {
        setVerificationEmail(signupEmail);
        setShowVerificationDialog(true);
        toast.success("Account created! Please check your email to verify your account.");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      if (error.message?.includes('already registered')) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "An error occurred during signup");
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast.error("Please provide an email address");
      return;
    }
    
    setIsResendingVerification(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(`Verification email resent to ${verificationEmail}`);
    } catch (error: any) {
      console.error("Error resending verification:", error);
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsRequestingReset(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(`Password reset email sent to ${forgotEmail}`);
      setActiveTab('login');
    } catch (error: any) {
      console.error("Error requesting password reset:", error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the admin panel or create a new account
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as 'login' | 'signup' | 'forgot')} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="forgot">Forgot</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email or Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      placeholder="admin@example.com or admin"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use "admin" with password "admin123" for demo admin access
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <button 
                    type="button" 
                    className="text-primary text-sm hover:underline"
                    onClick={() => setActiveTab('forgot')}
                  >
                    Forgot Your Password?
                  </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                  <h4 className="flex items-center font-medium mb-2">
                    <Info className="h-4 w-4 mr-2" />
                    Admin Access Info
                  </h4>
                  <p>
                    For admin access, use username <strong>admin</strong> with password <strong>admin123</strong>. 
                    This creates an admin account in the database if it doesn't exist already.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signupUsername">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signupUsername"
                      placeholder="your_username"
                      className="pl-9"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If not provided, username will be derived from your email
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isSigningUp}>
                  {isSigningUp ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="forgot">
            <form onSubmit={handlePasswordReset}>
              <CardContent className="space-y-4 pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800 mb-4">
                  <h4 className="flex items-center font-medium mb-2">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Forgot Your Password?
                  </h4>
                  <p>
                    Enter your email address below and we'll send you a link to reset your password.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-9"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isRequestingReset}>
                  {isRequestingReset ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Verification Required</DialogTitle>
            <DialogDescription>
              We've sent a verification email to <strong>{verificationEmail}</strong>. 
              Please check your inbox and click the verification link.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
              <h4 className="flex items-center font-medium mb-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Important Verification Notes
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Click the verification link in the same browser you used to sign up</li>
                <li>If you see a "This site can't be reached" error, try opening the link in this browser window</li>
                <li>The URL should redirect to this application automatically</li>
                <li>Verification links may expire after a certain period of time</li>
                <li>Check your spam or junk folder if you don't see the email</li>
              </ul>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input 
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                placeholder="Confirm your email address"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
            >
              Close
            </Button>
            <Button 
              type="button"
              onClick={handleResendVerification}
              disabled={isResendingVerification}
            >
              {isResendingVerification ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
