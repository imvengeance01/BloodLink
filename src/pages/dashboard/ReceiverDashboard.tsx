import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertCircle, Clock, CheckCircle, XCircle, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BloodGroup, UrgencyLevel, BloodRequest, CITIES, ReceiverUser } from '@/types';
import { getRequestsByReceiver, saveRequest, generateId } from '@/lib/storage';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const requestSchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  unitsNeeded: z.number().min(1).max(10),
  hospitalName: z.string().min(2, 'Hospital name is required').max(100),
  city: z.string().min(1, 'Please select a city'),
  urgencyLevel: z.enum(['emergency', 'within_24_hours', 'planned']),
  notes: z.string().max(500).optional(),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function ReceiverDashboard() {
  const { user } = useAuth();
  const receiver = user as ReceiverUser;
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      bloodGroup: 'O+',
      unitsNeeded: 1,
      hospitalName: receiver?.receiverType === 'hospital' ? receiver.name : '',
      city: receiver?.city || '',
      urgencyLevel: 'planned',
      notes: '',
    },
  });

  const loadRequests = () => {
    if (user) {
      const userRequests = getRequestsByReceiver(user.id);
      setRequests(userRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  useEffect(() => {
    loadRequests();
    // Polling every 5 seconds
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const onSubmit = async (data: RequestForm) => {
    if (!user) return;
    setIsLoading(true);

    const newRequest: BloodRequest = {
      id: generateId(),
      receiverId: user.id,
      receiverName: user.name,
      receiverContact: user.contactNumber,
      bloodGroup: data.bloodGroup,
      unitsNeeded: data.unitsNeeded,
      hospitalName: data.hospitalName,
      city: data.city,
      urgencyLevel: data.urgencyLevel,
      notes: data.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveRequest(newRequest);
    loadRequests();
    setIsDialogOpen(false);
    form.reset();
    setIsLoading(false);
    toast({ title: 'Request created!', description: 'Your blood request has been posted.' });
  };

  const handleCancelRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request && request.status === 'pending') {
      const updated = { ...request, status: 'cancelled' as const, updatedAt: new Date().toISOString() };
      saveRequest(updated);
      loadRequests();
      toast({ title: 'Request cancelled', description: 'Your blood request has been cancelled.' });
    }
  };

  const getStatusBadge = (status: BloodRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blood-pending/10 text-blood-pending border-blood-pending/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'matched':
        return <Badge className="bg-blood-matched/10 text-blood-matched border-blood-matched/20"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge>;
      case 'fulfilled':
        return <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20"><CheckCircle className="h-3 w-3 mr-1" />Fulfilled</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">
            {receiver?.receiverType === 'hospital' ? 'Hospital Dashboard' : 'Individual Dashboard'}
            {receiver?.receiverType === 'hospital' && !receiver.isVerified && (
              <span className="ml-2 text-blood-warning">(Verification Pending)</span>
            )}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Blood Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Blood Request</DialogTitle>
              <DialogDescription>
                Fill in the details to post a new blood request
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="unitsNeeded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Units Needed</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="hospitalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter hospital name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                  <FormField
                    control={form.control}
                    name="urgencyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="emergency">🔴 Emergency</SelectItem>
                            <SelectItem value="within_24_hours">🟠 Within 24 Hours</SelectItem>
                            <SelectItem value="planned">🟢 Planned</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Request
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blood-pending">{requests.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blood-matched">{requests.filter(r => r.status === 'matched').length}</div>
            <div className="text-sm text-muted-foreground">Matched</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blood-success">{requests.filter(r => r.status === 'fulfilled').length}</div>
            <div className="text-sm text-muted-foreground">Fulfilled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{requests.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Requests</h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No blood requests yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-lg font-bold">{request.bloodGroup}</Badge>
                      {getUrgencyBadge(request.urgencyLevel)}
                      {getStatusBadge(request.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hospital:</span>{' '}
                      <span className="font-medium">{request.hospitalName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">City:</span>{' '}
                      <span className="font-medium">{request.city}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Units:</span>{' '}
                      <span className="font-medium">{request.unitsNeeded}</span>
                    </div>
                  </div>

                  {request.notes && (
                    <p className="text-sm text-muted-foreground">{request.notes}</p>
                  )}

                  {/* Donor Info when matched */}
                  {request.status === 'matched' && request.donorName && (
                    <div className="p-3 rounded-lg bg-blood-matched/5 border border-blood-matched/20">
                      <p className="text-sm font-medium text-blood-matched mb-2">Donor Matched!</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-medium">{request.donorName}</span>
                        <a 
                          href={`tel:${request.donorContact}`} 
                          className="inline-flex items-center gap-1 text-blood-matched hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {request.donorContact}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                    {request.status === 'matched' && (
                      <Button 
                        size="sm"
                        className="bg-blood-success hover:bg-blood-success/90"
                        onClick={() => {
                          const updated = { ...request, status: 'fulfilled' as const, updatedAt: new Date().toISOString() };
                          saveRequest(updated);
                          loadRequests();
                          toast({ title: 'Request fulfilled!', description: 'Thank you for confirming.' });
                        }}
                      >
                        Mark as Fulfilled
                      </Button>
                    )}
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
