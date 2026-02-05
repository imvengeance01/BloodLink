import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, ArrowLeft, Loader2, Heart, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CITIES, UserRole, BloodGroup, ReceiverType, OrganizationType } from '@/types';
import { saveVerification, generateId } from '@/lib/storage';

const baseSchema = {
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  city: z.string().min(1, 'Please select a city'),
  contactNumber: z.string().min(10, 'Please enter a valid contact number').max(15),
};

const receiverSchema = z.object({
  ...baseSchema,
  receiverType: z.enum(['individual', 'hospital']),
});

const donorSchema = z.object({
  ...baseSchema,
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  lastDonationDate: z.string().optional(),
});

const organizationSchema = z.object({
  ...baseSchema,
  organizationType: z.enum(['blood_bank', 'ngo']),
  licenseId: z.string().min(3, 'License ID is required'),
});

type ReceiverForm = z.infer<typeof receiverSchema>;
type DonorForm = z.infer<typeof donorSchema>;
type OrganizationForm = z.infer<typeof organizationSchema>;

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'receiver';
  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const receiverForm = useForm<ReceiverForm>({
    resolver: zodResolver(receiverSchema),
    defaultValues: { name: '', email: '', password: '', city: '', contactNumber: '', receiverType: 'individual' },
  });

  const donorForm = useForm<DonorForm>({
    resolver: zodResolver(donorSchema),
    defaultValues: { name: '', email: '', password: '', city: '', contactNumber: '', bloodGroup: 'O+', lastDonationDate: '' },
  });

  const orgForm = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: '', email: '', password: '', city: '', contactNumber: '', organizationType: 'blood_bank', licenseId: '' },
  });

  const handleReceiverSubmit = async (data: ReceiverForm) => {
    setIsLoading(true);
    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
      city: data.city,
      contactNumber: data.contactNumber,
      role: 'receiver' as const,
      receiverType: data.receiverType,
      isVerified: data.receiverType === 'individual', // Individuals auto-verified, hospitals need org approval
    });
    setIsLoading(false);

    if (result.success) {
      // Create verification request for hospitals
      if (data.receiverType === 'hospital') {
        saveVerification({
          id: generateId(),
          hospitalId: '', // Will be updated after user creation
          hospitalName: data.name,
          hospitalEmail: data.email,
          city: data.city,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
      toast({ title: 'Registration successful!', description: 'Welcome to BloodLink.' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleDonorSubmit = async (data: DonorForm) => {
    setIsLoading(true);
    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
      city: data.city,
      contactNumber: data.contactNumber,
      role: 'donor' as const,
      bloodGroup: data.bloodGroup,
      lastDonationDate: data.lastDonationDate || undefined,
      cooldownEndDate: undefined,
    });
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Registration successful!', description: 'Welcome to BloodLink. Start saving lives!' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleOrgSubmit = async (data: OrganizationForm) => {
    setIsLoading(true);
    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
      city: data.city,
      contactNumber: data.contactNumber,
      role: 'organization' as const,
      organizationType: data.organizationType,
      licenseId: data.licenseId,
    });
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Registration successful!', description: 'Welcome to BloodLink.' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>

      {/* Register Form */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplets className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join BloodLink and make a difference</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserRole)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="receiver" className="gap-1">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Receiver</span>
                </TabsTrigger>
                <TabsTrigger value="donor" className="gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Donor</span>
                </TabsTrigger>
                <TabsTrigger value="organization" className="gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Org</span>
                </TabsTrigger>
              </TabsList>

              {/* Receiver Form */}
              <TabsContent value="receiver">
                <Form {...receiverForm}>
                  <form onSubmit={receiverForm.handleSubmit(handleReceiverSubmit)} className="space-y-4">
                    <FormField
                      control={receiverForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name or hospital name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={receiverForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={receiverForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={receiverForm.control}
                        name="receiverType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="hospital">Hospital</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={receiverForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </div>
                    <FormField
                      control={receiverForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Donor Form */}
              <TabsContent value="donor">
                <Form {...donorForm}>
                  <form onSubmit={donorForm.handleSubmit(handleDonorSubmit)} className="space-y-4">
                    <FormField
                      control={donorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={donorForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={donorForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={donorForm.control}
                        name="bloodGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blood Group</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BLOOD_GROUPS.map((bg) => (
                                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={donorForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </div>
                    <FormField
                      control={donorForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={donorForm.control}
                      name="lastDonationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Donation Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-blood-success hover:bg-blood-success/90" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Register as Donor
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Organization Form */}
              <TabsContent value="organization">
                <Form {...orgForm}>
                  <form onSubmit={orgForm.handleSubmit(handleOrgSubmit)} className="space-y-4">
                    <FormField
                      control={orgForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orgForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="org@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orgForm.control}
                        name="organizationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blood_bank">Blood Bank</SelectItem>
                                <SelectItem value="ngo">NGO</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </div>
                    <FormField
                      control={orgForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgForm.control}
                      name="licenseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License/Verification ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter license number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-blood-matched hover:bg-blood-matched/90" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Register Organization
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
