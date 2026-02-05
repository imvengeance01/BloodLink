import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Calendar, Building2, MapPin } from 'lucide-react';
import { useAuth, useDonorCooldown } from '@/contexts/AuthContext';
import { DonorUser, DonationRecord } from '@/types';
import { getDonationsByDonor } from '@/lib/storage';
import { format, formatDistanceToNow } from 'date-fns';

export default function DonorDonations() {
  const { user } = useAuth();
  const donor = user as DonorUser;
  const { isOnCooldown, daysRemaining } = useDonorCooldown(donor);
  const [donations, setDonations] = useState<DonationRecord[]>([]);

  useEffect(() => {
    if (donor) {
      const donorDonations = getDonationsByDonor(donor.id);
      setDonations(donorDonations.sort((a, b) => 
        new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()
      ));
    }
  }, [donor]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Donations</h1>
        <p className="text-muted-foreground">Your blood donation history and cooldown status</p>
      </div>

      {/* Cooldown Status */}
      <Card className={isOnCooldown ? 'border-blood-warning bg-blood-warning/5' : 'border-blood-success bg-blood-success/5'}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${isOnCooldown ? 'bg-blood-warning/10' : 'bg-blood-success/10'}`}>
              <Heart className={`h-8 w-8 ${isOnCooldown ? 'text-blood-warning' : 'text-blood-success'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {isOnCooldown ? 'Cooldown Active' : 'Ready to Donate'}
              </h3>
              <p className="text-muted-foreground">
                {isOnCooldown 
                  ? `You can donate again in ${daysRemaining} days`
                  : 'You are eligible to accept new blood requests'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donation History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Donation History</h2>
        
        {donations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                You haven't made any donations yet. Start saving lives today!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card key={donation.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold text-lg">
                          {donation.bloodGroup}
                        </Badge>
                        <span className="text-muted-foreground">donated to</span>
                        <span className="font-medium">{donation.receiverName}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {donation.hospitalName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(donation.donationDate), 'PPP')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(donation.donationDate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-blood-success/10">
              <div className="text-3xl font-bold text-blood-success">{donations.length}</div>
              <div className="text-sm text-muted-foreground">Total Donations</div>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <div className="text-3xl font-bold text-primary">{donations.length * 3}</div>
              <div className="text-sm text-muted-foreground">Lives Potentially Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
