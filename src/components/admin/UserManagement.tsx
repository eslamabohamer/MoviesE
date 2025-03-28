import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, updateUserSafe, deleteUserSafe } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type User = {
  id: string;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
};

// Mock data for demo admin user
const mockAdminUsers = [
  {
    id: 'admin-demo-id',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin' as const,
    created_at: new Date().toISOString(),
  }
];

// Fetch Users via RPC function to completely bypass RLS
const fetchUsers = async (isDemoAdmin: boolean) => {
  console.log('Fetching users...');
  
  // If demo admin, return mock data
  if (isDemoAdmin) {
    console.log('Using mock data for demo admin');
    return mockAdminUsers;
  }
  
  try {
    // Call the stored procedure directly that has SECURITY DEFINER
    const { data, error } = await supabase
      .rpc('get_all_users');
    
    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(`Error fetching users: ${error.message}`);
    }
    
    console.log('Users fetched successfully:', data);
    return data as User[];
    
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    throw new Error(error.message || "Failed to fetch users");
  }
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  
  const queryClient = useQueryClient();
  
  // Check if we're using the demo admin account
  const isDemoAdmin = currentUser?.id === 'admin-demo-id';
  
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['users', isDemoAdmin],
    queryFn: () => fetchUsers(isDemoAdmin),
    retry: 1, // Only retry once to avoid excessive failed requests
  });
  
  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, username, role }: {
      email: string;
      password: string;
      username: string;
      role: 'admin' | 'user';
    }) => {
      if (isDemoAdmin) {
        toast.info('User creation functionality is disabled in this demo');
        return { id: 'new-user-id', username, email, role };
      }
      
      try {
        // Instead of using admin.createUser, we'll use the signup method
        // and then update the role in a separate step
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        
        if (authError) throw new Error(`Failed to create user account: ${authError.message}`);
        
        if (!authData.user) {
          throw new Error('User creation failed: No user data returned');
        }
        
        // Step 2: Update the role in the users table if needed
        if (role === 'admin') {
          // Use our special RPC function to update the role safely
          const success = await updateUserSafe(authData.user.id, { role });
          if (!success) throw new Error('Failed to set user role');
        }
        
        return authData.user;
      } catch (error: any) {
        console.error('User creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateUserOpen(false);
      resetCreateForm();
      toast.success('User created successfully. Check email for confirmation link.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    }
  });
  
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, username, role }: {
      id: string;
      username: string;
      role: 'admin' | 'user';
    }) => {
      if (isDemoAdmin) {
        toast.info('User update functionality is disabled in this demo');
        return { id, username, role };
      }
      
      // Use the safe update function instead of direct table updates
      const success = await updateUserSafe(id, { username, role });
      if (!success) throw new Error('Failed to update user');
      
      return { id, username, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditUserOpen(false);
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`);
    }
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (isDemoAdmin) {
        toast.info('User deletion functionality is disabled in this demo');
        return userId;
      }
      
      // Use the safe delete function instead of direct table deletes
      const success = await deleteUserSafe(userId);
      if (!success) throw new Error('Failed to delete user');
      
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove user: ${error.message}`);
    }
  });
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newPassword || !newUsername) {
      toast.error('Please fill in all fields');
      return;
    }
    
    createUserMutation.mutate({
      email: newEmail,
      password: newPassword,
      username: newUsername,
      role: newRole
    });
  };
  
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      username: editUsername,
      role: editRole
    });
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditRole(user.role);
    setIsEditUserOpen(true);
  };
  
  const resetCreateForm = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('user');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. They'll receive an email with instructions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username</Label>
                    <Input
                      id="new-username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="johndoe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-role">Role</Label>
                    <Select
                      value={newRole}
                      onValueChange={(value) => setNewRole(value as 'admin' | 'user')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {isError && (
        <div className="text-center py-8 glass-card rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      )}
      
      {!isLoading && !isError && users.length === 0 && (
        <div className="text-center py-8 glass-card rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Users Found</h2>
          <p className="text-muted-foreground mb-4">
            Start by adding your first user!
          </p>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
      
      {!isLoading && !isError && users.length > 0 && (
        <div className="overflow-x-auto relative shadow-md rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                        disabled={user.id === currentUser?.id}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUser}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editRole}
                    onValueChange={(value) => setEditRole(value as 'admin' | 'user')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  Update User
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
