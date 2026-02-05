import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User, Heart, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'receiver':
        return [
          { icon: Home, label: 'Home', path: '/dashboard' },
          { icon: FileText, label: 'Requests', path: '/dashboard/requests' },
          { icon: User, label: 'Profile', path: '/dashboard/profile' },
        ];
      case 'donor':
        return [
          { icon: Home, label: 'Find', path: '/dashboard' },
          { icon: Heart, label: 'Donations', path: '/dashboard/donations' },
          { icon: User, label: 'Profile', path: '/dashboard/profile' },
        ];
      case 'organization':
        return [
          { icon: Home, label: 'Overview', path: '/dashboard' },
          { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
          { icon: ShieldCheck, label: 'Verify', path: '/dashboard/verifications' },
          { icon: User, label: 'Profile', path: '/dashboard/profile' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
