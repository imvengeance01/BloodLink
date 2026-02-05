import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldCheck, ShieldX, Clock, Building2, MapPin, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { OrganizationUser, VerificationRequest, ReceiverUser } from '@/types';
import { getVerifications, saveVerification, getUsers, saveUser } from '@/lib/storage';
import { format } from 'date-fns';

export default function OrganizationVerifications() {
  const { user } = useAuth();
  const org = user as OrganizationUser;
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadVerifications = () => {
    if (org) {
      const all = getVerifications();
      // Filter to show verifications in org's city
      const localVerifications = all.filter(v => v.city === org.city);
      setVerifications(localVerifications);
    }
  };

  useEffect(() => {
    loadVerifications();
    const interval = setInterval(loadVerifications, 5000);
    return () => clearInterval(interval);
  }, [org]);

  const handleApprove = (verification: VerificationRequest) => {
    // Update verification
    const updated: VerificationRequest = {
      ...verification,
      status: 'approved',
      reviewedBy: org.id,
      reviewedAt: new Date().toISOString(),
      notes,
    };
    saveVerification(updated);

    // Update hospital user to verified
    const users = getUsers();
    const hospital = users.find(u => 
      u.email === verification.hospitalEmail && u.role === 'receiver'
    ) as ReceiverUser | undefined;
    
    if (hospital) {
      saveUser({ ...hospital, isVerified: true });
    }

    loadVerifications();
    setIsDialogOpen(false);
    setNotes('');
    toast({ 
      title: 'Hospital Verified!', 
      description: `${verification.hospitalName} has been verified.` 
    });
  };

  const handleReject = (verification: VerificationRequest) => {
    const updated: VerificationRequest = {
      ...verification,
      status: 'rejected',
      reviewedBy: org.id,
      reviewedAt: new Date().toISOString(),
      notes,
    };
    saveVerification(updated);
    loadVerifications();
    setIsDialogOpen(false);
    setNotes('');
    toast({ 
      title: 'Verification Rejected', 
      description: `${verification.hospitalName} has been rejected.`,
      variant: 'destructive'
    });
  };

  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const processedVerifications = verifications.filter(v => v.status !== 'pending');

  const getStatusBadge = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blood-pending/10 text-blood-pending border-blood-pending/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20"><ShieldCheck className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><ShieldX className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hospital Verifications</h1>
        <p className="text-muted-foreground">Review and verify hospital registration requests in {org?.city}</p>
      </div>

      {/* Pending Verifications */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-blood-pending" />
          Pending Verifications ({pendingVerifications.length})
        </h2>

        {pendingVerifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No pending verification requests in your area.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingVerifications.map((verification) => (
              <Card key={verification.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-lg">{verification.hospitalName}</span>
                        {getStatusBadge(verification.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {verification.hospitalEmail}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {verification.city}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {format(new Date(verification.createdAt), 'PPP')}
                      </p>
                    </div>
                    <Dialog open={isDialogOpen && selectedVerification?.id === verification.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (open) setSelectedVerification(verification);
                    }}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedVerification(verification)}>
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Verification Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-muted">
                            <h4 className="font-semibold">{verification.hospitalName}</h4>
                            <p className="text-sm text-muted-foreground">{verification.hospitalEmail}</p>
                            <p className="text-sm text-muted-foreground">{verification.city}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <Textarea
                              placeholder="Add any notes about this verification..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1 bg-blood-success hover:bg-blood-success/90"
                              onClick={() => handleApprove(verification)}
                            >
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleReject(verification)}
                            >
                              <ShieldX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed Verifications */}
      {processedVerifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Processed Verifications</h2>
          <div className="space-y-2">
            {processedVerifications.map((verification) => (
              <Card key={verification.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{verification.hospitalName}</span>
                        <p className="text-sm text-muted-foreground">
                          {verification.reviewedAt && format(new Date(verification.reviewedAt), 'PPP')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(verification.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
