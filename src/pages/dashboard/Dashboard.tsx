import { useAuth } from '@/contexts/AuthContext';
import ReceiverDashboard from './ReceiverDashboard';
import DonorDashboard from './DonorDashboard';
import OrganizationDashboard from './OrganizationDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'receiver':
      return <ReceiverDashboard />;
    case 'donor':
      return <DonorDashboard />;
    case 'organization':
      return <OrganizationDashboard />;
    default:
      return null;
  }
}
