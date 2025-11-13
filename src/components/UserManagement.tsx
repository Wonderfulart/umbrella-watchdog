import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Shield, User, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'agent';
}

export function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    userId: string;
    action: 'add' | 'remove';
    role: 'admin' | 'agent';
  } | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (userId: string): 'admin' | 'agent' | null => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || null;
  };

  const getAdminCount = () => {
    return userRoles.filter((r) => r.role === 'admin').length;
  };

  const confirmAction = (userId: string, action: 'add' | 'remove', role: 'admin' | 'agent') => {
    // Prevent removing the last admin
    if (action === 'remove' && role === 'admin' && getAdminCount() === 1) {
      toast.error('Cannot remove the last admin user');
      return;
    }

    setSelectedAction({ userId, action, role });
    setDialogOpen(true);
  };

  const handleRoleAction = async () => {
    if (!selectedAction) return;

    const { userId, action, role } = selectedAction;
    setActionLoading(userId);

    try {
      if (action === 'add') {
        const { error } = await supabase.from('user_roles').insert({
          user_id: userId,
          role: role,
        });

        if (error) {
          if (error.code === '23505') {
            toast.error('User already has this role');
          } else {
            throw error;
          }
        } else {
          toast.success(`${role === 'admin' ? 'Admin' : 'Agent'} role assigned successfully`);
          await fetchData();
        }
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
        toast.success(`${role === 'admin' ? 'Admin' : 'Agent'} role removed successfully`);
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error managing role:', error);
      toast.error('Failed to update user role');
    } finally {
      setActionLoading(null);
      setDialogOpen(false);
      setSelectedAction(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Assign admin or agent roles to control access levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const role = getUserRole(profile.id);
                  const isCurrentUser = profile.id === currentUser?.id;
                  const isLastAdmin = role === 'admin' && getAdminCount() === 1;

                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.first_name} {profile.last_name}
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        {role ? (
                          <Badge
                            variant={role === 'admin' ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {role === 'admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {role === 'admin' ? 'Admin' : 'Agent'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Role</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {role === 'admin' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmAction(profile.id, 'remove', 'admin')}
                              disabled={actionLoading === profile.id || isLastAdmin}
                            >
                              {actionLoading === profile.id ? 'Updating...' : 'Remove Admin'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => confirmAction(profile.id, 'add', 'admin')}
                              disabled={actionLoading === profile.id}
                            >
                              {actionLoading === profile.id ? 'Updating...' : 'Make Admin'}
                            </Button>
                          )}
                          {role === 'agent' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmAction(profile.id, 'remove', 'agent')}
                              disabled={actionLoading === profile.id}
                            >
                              {actionLoading === profile.id ? 'Updating...' : 'Remove Agent'}
                            </Button>
                          ) : role === null ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => confirmAction(profile.id, 'add', 'agent')}
                              disabled={actionLoading === profile.id}
                            >
                              {actionLoading === profile.id ? 'Updating...' : 'Make Agent'}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {getAdminCount() === 1 && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-500">Last Admin Warning</p>
                <p className="text-sm text-muted-foreground mt-1">
                  There is only one admin user. Make sure to assign admin role to another user
                  before removing the current admin to avoid losing administrative access.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction?.action === 'add'
                ? `Are you sure you want to assign the ${selectedAction.role} role to this user?`
                : `Are you sure you want to remove the ${selectedAction?.role} role from this user?`}
              {selectedAction?.action === 'add' &&
                selectedAction.role === 'admin' &&
                ' This will grant them full administrative access.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
