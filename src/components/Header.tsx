import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, User } from 'lucide-react';

export function Header() {
  const { user, userRole, signOut } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Policy Dashboard</h1>
          {userRole && (
            <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="gap-1">
              {userRole === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {userRole === 'admin' ? 'Admin' : 'Agent'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
