import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Phone, Mail, Heart, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CITIES, ReceiverUser, DonorUser, OrganizationUser, BloodGroup } from '@/types';
import { useState } from 'react';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  contactNumber: z.string().min(10, 'Please enter a valid contact number').max(15),
  city: z.string().min(1, 'Please select a city'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      contactNumber: user?.contactNumber || '',
      city: user?.city || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    updateUser(data);
    setIsLoading(false);
    toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
  };

  const getRoleInfo = () => {
    if (!user) return null;

    switch (user.role) {
      case 'receiver':
        const receiver = user as ReceiverUser;
        return (
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {receiver.receiverType === 'hospital' ? 'Hospital' : 'Individual'} Receiver
            </span>
            {receiver.receiverType === 'hospital' && (
              <Badge className={receiver.isVerified ? 'bg-blood-success' : 'bg-blood-warning'}>
                {receiver.isVerified ? 'Verified' : 'Pending Verification'}
              </Badge>
            )}
          </div>
        );
      case 'donor':
        const donor = user as DonorUser;
        return (
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-blood-success" />
            <span className="font-medium">Blood Donor</span>
            <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20">
              {donor.bloodGroup}
            </Badge>
          </div>
        );
      case 'organization':
        const org = user as OrganizationUser;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blood-matched" />
            <span className="font-medium">
              {org.organizationType === 'blood_bank' ? 'Blood Bank' : 'NGO'}
            </span>
            <Badge variant="outline">License: {org.licenseId}</Badge>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getRoleInfo()}
          <p className="text-sm text-muted-foreground mt-2">
            Member since {new Date(user?.createdAt || '').toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </FormItem>

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {user?.role === 'donor' && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">Blood Group</p>
                  <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20 text-lg">
                    {(user as DonorUser).bloodGroup}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Blood group cannot be changed. Contact support if incorrect.
                  </p>
                </div>
              )}

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
