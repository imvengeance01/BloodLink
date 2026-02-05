import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Users, FileText, AlertTriangle, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationUser, BloodRequest, BloodGroup } from '@/types';
import { getRequests, getUsers, getInventoryByOrganization } from '@/lib/storage';

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const org = user as OrganizationUser;
  const [areaRequests, setAreaRequests] = useState<BloodRequest[]>([]);
  const [donorStats, setDonorStats] = useState({ total: 0, available: 0, cooldown: 0 });
  const [inventoryStats, setInventoryStats] = useState<Record<BloodGroup, number>>({
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
  });

  const loadData = () => {
    if (!org) return;

    // Load requests in org's area
    const allRequests = getRequests();
    const localRequests = allRequests.filter(r => r.city === org.city);
    setAreaRequests(localRequests);

    // Load donor stats
    const allUsers = getUsers();
    const localDonors = allUsers.filter(u => u.role === 'donor' && u.city === org.city);
    const now = new Date();
    const available = localDonors.filter(d => {
      if (d.role !== 'donor') return false;
      return !d.cooldownEndDate || new Date(d.cooldownEndDate) < now;
    });
    const onCooldown = localDonors.filter(d => {
      if (d.role !== 'donor') return false;
      return d.cooldownEndDate && new Date(d.cooldownEndDate) >= now;
    });
    
    setDonorStats({
      total: localDonors.length,
      available: available.length,
      cooldown: onCooldown.length,
    });

    // Load inventory
    const inventory = getInventoryByOrganization(org.id);
    const stats: Record<BloodGroup, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
    };
    inventory.forEach(item => {
      stats[item.bloodGroup] = (stats[item.bloodGroup] || 0) + item.units;
    });
    setInventoryStats(stats);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [org]);

  const pendingRequests = areaRequests.filter(r => r.status === 'pending');
  const matchedRequests = areaRequests.filter(r => r.status === 'matched');
  const fulfilledRequests = areaRequests.filter(r => r.status === 'fulfilled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{org?.name}</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Badge className="bg-blood-matched/10 text-blood-matched border-blood-matched/20">
            <Building2 className="h-3 w-3 mr-1" />
            {org?.organizationType === 'blood_bank' ? 'Blood Bank' : 'NGO'}
          </Badge>
          {org?.city}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blood-warning/20 bg-blood-warning/5">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-blood-warning" />
            <div className="text-2xl font-bold text-blood-warning">{pendingRequests.length}</div>
            <div className="text-sm text-muted-foreground">Pending Requests</div>
          </CardContent>
        </Card>
        <Card className="border-blood-matched/20 bg-blood-matched/5">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blood-matched" />
            <div className="text-2xl font-bold text-blood-matched">{matchedRequests.length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="border-blood-success/20 bg-blood-success/5">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blood-success" />
            <div className="text-2xl font-bold text-blood-success">{fulfilledRequests.length}</div>
            <div className="text-sm text-muted-foreground">Fulfilled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{donorStats.total}</div>
            <div className="text-sm text-muted-foreground">Local Donors</div>
          </CardContent>
        </Card>
      </div>

      {/* Donor Network */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Donor Network in {org?.city}
          </CardTitle>
          <CardDescription>Overview of registered donors in your service area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{donorStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Registered</div>
            </div>
            <div className="p-4 rounded-lg bg-blood-success/10">
              <div className="text-2xl font-bold text-blood-success">{donorStats.available}</div>
              <div className="text-sm text-muted-foreground">Available Now</div>
            </div>
            <div className="p-4 rounded-lg bg-blood-warning/10">
              <div className="text-2xl font-bold text-blood-warning">{donorStats.cooldown}</div>
              <div className="text-sm text-muted-foreground">On Cooldown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Inventory View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Blood Inventory
          </CardTitle>
          <CardDescription>Current stock levels by blood type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {(Object.entries(inventoryStats) as [BloodGroup, number][]).map(([group, units]) => (
              <div 
                key={group}
                className={`p-3 rounded-lg text-center border ${
                  units === 0 ? 'bg-destructive/10 border-destructive/20' :
                  units < 5 ? 'bg-blood-warning/10 border-blood-warning/20' :
                  'bg-blood-success/10 border-blood-success/20'
                }`}
              >
                <div className="text-lg font-bold">{group}</div>
                <div className={`text-sm ${
                  units === 0 ? 'text-destructive' :
                  units < 5 ? 'text-blood-warning' :
                  'text-blood-success'
                }`}>
                  {units} units
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests in {org?.city}</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No pending requests in your area.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-bold">{request.bloodGroup}</Badge>
                    <div>
                      <p className="font-medium">{request.hospitalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.unitsNeeded} unit(s) • {request.urgencyLevel.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    request.urgencyLevel === 'emergency' ? 'bg-primary' :
                    request.urgencyLevel === 'within_24_hours' ? 'bg-blood-warning' :
                    'bg-blood-success'
                  }>
                    {request.urgencyLevel === 'emergency' ? '🔴' :
                     request.urgencyLevel === 'within_24_hours' ? '🟠' : '🟢'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
