
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasResetToken, setHasResetToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a hash fragment for the password reset
    const hash = window.location.hash;
    const query = new URLSearchParams(window.location.search);
    
    // Supabase auth sends either a hash fragment or type & token parameters
    setHasResetToken(
      hash.includes('type=recovery') || 
      (query.get('type') === 'recovery' && !!query.get('token'))
    );
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password has been reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      if (error.message?.includes('token')) {
        toast.error('Your password reset link has expired or is invalid. Please request a new one.');
      } else {
        toast.error(error.message || 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Choose a new password for your account
          </CardDescription>
        </CardHeader>
        
        {!hasResetToken ? (
          <CardContent className="pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
              <h4 className="flex items-center font-medium mb-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Invalid Reset Link
              </h4>
              <p className="mb-4">
                This reset link appears to be invalid or has expired. Please request a new password reset link.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
