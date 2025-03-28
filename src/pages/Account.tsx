
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ChangePassword from '@/components/auth/ChangePassword';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const Account = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You need to be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-background/80">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6" />
              My Account
            </CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ChangePassword />
      </div>
    </div>
  );
};

export default Account;
