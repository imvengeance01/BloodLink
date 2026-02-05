import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, MapPin, Building2, Heart, CheckCircle } from 'lucide-react';
import { useAuth, useDonorCooldown } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { DonorUser, BloodRequest, BLOOD_COMPATIBILITY, UrgencyLevel } from '@/types';
import { getRequests, saveRequest, saveDonation, saveUser, generateId, getUserById } from '@/lib/storage';
import { formatDistanceToNow, addMonths } from 'date-fns';

export default function DonorDashboard() {
  const { user, refreshUser } = useAuth();
  const donor = user as DonorUser;
  const { isOnCooldown, daysRemaining } = useDonorCooldown(donor);
  const [compatibleRequests, setCompatibleRequests] = useState<BloodRequest[]>([]);

  const loadCompatibleRequests = () => {
    if (!donor) return;

    const allRequests = getRequests();
    
    // Filter requests that this donor can fulfill
    const compatible = allRequests.filter((request) => {
      // Only pending requests
      if (request.status !== 'pending') return false;
      
      // Same city
      if (request.city !== donor.city) return false;
      
      // Blood compatibility check
      const canDonateTo = BLOOD_COMPATIBILITY[donor.bloodGroup];
      return canDonateTo.includes(request.bloodGroup);
    });

    // Sort by urgency (emergency first) and then by date
    const urgencyOrder: Record<UrgencyLevel, number> = {
      emergency: 0,
      within_24_hours: 1,
      planned: 2,
    };

    compatible.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setCompatibleRequests(compatible);
  };

  useEffect(() => {
    loadCompatibleRequests();
    // Polling every 5 seconds
    const interval = setInterval(loadCompatibleRequests, 5000);
    return () => clearInterval(interval);
  }, [donor]);

  const handleAcceptRequest = (request: BloodRequest) => {
    if (!donor || isOnCooldown) return;

    // Update request to matched status
    const cooldownEnd = addMonths(new Date(), 3);
    const updatedRequest: BloodRequest = {
      ...request,
      status: 'matched',
      donorId: donor.id,
      donorName: donor.name,
      donorContact: donor.contactNumber,
      updatedAt: new Date().toISOString(),
    };
    saveRequest(updatedRequest);

    // Create donation record
    saveDonation({
      id: generateId(),
      donorId: donor.id,
      requestId: request.id,
      receiverName: request.receiverName,
      bloodGroup: request.bloodGroup,
      hospitalName: request.hospitalName,
      donationDate: new Date().toISOString(),
      cooldownEndDate: cooldownEnd.toISOString(),
    });

    // Update donor with cooldown
    const updatedDonor: DonorUser = {
      ...donor,
      lastDonationDate: new Date().toISOString(),
      cooldownEndDate: cooldownEnd.toISOString(),
    };
    saveUser(updatedDonor);
    refreshUser();

    loadCompatibleRequests();
    toast({
      title: 'Request accepted!',
      description: 'The receiver has been notified. A 3-month cooldown has started.',
    });
  };

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'emergency':
        return <Badge className="bg-primary text-primary-foreground animate-pulse-emergency">🔴 Emergency</Badge>;
      case 'within_24_hours':
        return <Badge className="bg-blood-warning text-white">🟠 Within 24 Hours</Badge>;
      case 'planned':
        return <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20">🟢 Planned</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {donor?.name}</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20">
            {donor?.bloodGroup}
          </Badge>
          Blood Donor • {donor?.city}
        </p>
      </div>

      {/* Cooldown Alert */}
      {isOnCooldown && (
        <Alert className="border-blood-warning bg-blood-warning/5">
          <AlertTriangle className="h-4 w-4 text-blood-warning" />
          <AlertTitle className="text-blood-warning">Cooldown Active</AlertTitle>
          <AlertDescription>
            You've recently donated blood. For your safety, you cannot accept new requests for{' '}
            <strong>{daysRemaining} days</strong>. You can still browse available requests.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-blood-success" />
            <div className="text-2xl font-bold text-blood-success">{compatibleRequests.length}</div>
            <div className="text-sm text-muted-foreground">Compatible Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {isOnCooldown ? `${daysRemaining}d` : 'Ready'}
            </div>
            <div className="text-sm text-muted-foreground">
              {isOnCooldown ? 'Until Available' : 'To Donate'}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blood-matched" />
            <div className="text-2xl font-bold">{donor?.bloodGroup}</div>
            <div className="text-sm text-muted-foreground">Your Blood Type</div>
          </CardContent>
        </Card>
      </div>

      {/* Compatible Requests */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Available Requests in {donor?.city}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            (Compatible with {donor?.bloodGroup})
          </span>
        </h2>

        {compatibleRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No compatible blood requests in your area right now. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {compatibleRequests.map((request) => (
              <Card 
                key={request.id} 
                className={request.urgencyLevel === 'emergency' ? 'border-primary/50 bg-primary/5' : ''}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-lg font-bold border-2">
                        {request.bloodGroup}
                      </Badge>
                      {getUrgencyBadge(request.urgencyLevel)}
                      <Badge variant="secondary">{request.unitsNeeded} unit(s)</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.hospitalName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{request.city}</span>
                    </div>
                  </div>

                  {request.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {request.notes}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleAcceptRequest(request)}
                      disabled={isOnCooldown}
                      className={isOnCooldown ? '' : 'bg-blood-success hover:bg-blood-success/90'}
                    >
                      {isOnCooldown ? 'On Cooldown' : 'Accept & Donate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
