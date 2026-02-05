import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Droplets, User, LogOut, Settings, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DonorUser, ReceiverUser, OrganizationUser } from '@/types';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'receiver':
        const receiver = user as ReceiverUser;
        return (
          <Badge variant="secondary" className="hidden sm:flex">
            {receiver.receiverType === 'hospital' ? 'Hospital' : 'Individual'}
            {receiver.receiverType === 'hospital' && receiver.isVerified && (
              <span className="ml-1 text-blood-success">✓</span>
            )}
          </Badge>
        );
      case 'donor':
        const donor = user as DonorUser;
        return (
          <Badge className="hidden sm:flex bg-blood-success/10 text-blood-success border-blood-success/20">
            Donor • {donor.bloodGroup}
          </Badge>
        );
      case 'organization':
        const org = user as OrganizationUser;
        return (
          <Badge className="hidden sm:flex bg-blood-matched/10 text-blood-matched border-blood-matched/20">
            {org.organizationType === 'blood_bank' ? 'Blood Bank' : 'NGO'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold hidden sm:inline">BloodLink</span>
          </Link>
          {getRoleBadge()}
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {user?.role === 'receiver' && (
            <>
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/dashboard/requests" className="text-sm font-medium hover:text-primary transition-colors">
                My Requests
              </Link>
            </>
          )}
          {user?.role === 'donor' && (
            <>
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Find Requests
              </Link>
              <Link to="/dashboard/donations" className="text-sm font-medium hover:text-primary transition-colors">
                My Donations
              </Link>
            </>
          )}
          {user?.role === 'organization' && (
            <>
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Overview
              </Link>
              <Link to="/dashboard/inventory" className="text-sm font-medium hover:text-primary transition-colors">
                Inventory
              </Link>
              <Link to="/dashboard/verifications" className="text-sm font-medium hover:text-primary transition-colors">
                Verifications
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                <Settings className="h-4 w-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user?.role === 'receiver' && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/requests')}>
                    My Requests
                  </DropdownMenuItem>
                </>
              )}
              {user?.role === 'donor' && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Find Requests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/donations')}>
                    My Donations
                  </DropdownMenuItem>
                </>
              )}
              {user?.role === 'organization' && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Overview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/inventory')}>
                    Inventory
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/verifications')}>
                    Verifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
