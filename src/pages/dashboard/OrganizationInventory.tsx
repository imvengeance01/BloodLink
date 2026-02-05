import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Plus, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { OrganizationUser, BloodInventoryItem, BloodGroup, StockLevel } from '@/types';
import { getInventoryByOrganization, saveInventoryItem, generateId } from '@/lib/storage';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const inventorySchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  units: z.number().min(0).max(1000),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

type InventoryForm = z.infer<typeof inventorySchema>;

export default function OrganizationInventory() {
  const { user } = useAuth();
  const org = user as OrganizationUser;
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BloodInventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InventoryForm>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      bloodGroup: 'O+',
      units: 0,
      expiryDate: '',
    },
  });

  const loadInventory = () => {
    if (org) {
      const items = getInventoryByOrganization(org.id);
      setInventory(items);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [org]);

  const getStockLevel = (units: number): StockLevel => {
    if (units === 0) return 'critical';
    if (units < 5) return 'low';
    if (units < 20) return 'adequate';
    return 'full';
  };

  const getStockBadge = (level: StockLevel) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-destructive">Critical</Badge>;
      case 'low':
        return <Badge className="bg-blood-warning">Low</Badge>;
      case 'adequate':
        return <Badge className="bg-blood-success/10 text-blood-success border-blood-success/20">Adequate</Badge>;
      case 'full':
        return <Badge className="bg-blood-success">Full</Badge>;
    }
  };

  const onSubmit = async (data: InventoryForm) => {
    if (!org) return;
    setIsLoading(true);

    const item: BloodInventoryItem = {
      id: editingItem?.id || generateId(),
      organizationId: org.id,
      bloodGroup: data.bloodGroup,
      units: data.units,
      stockLevel: getStockLevel(data.units),
      expiryDate: data.expiryDate,
      lastUpdated: new Date().toISOString(),
    };

    saveInventoryItem(item);
    loadInventory();
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset();
    setIsLoading(false);
    toast({ 
      title: editingItem ? 'Inventory updated!' : 'Stock added!', 
      description: `${data.bloodGroup} blood stock has been ${editingItem ? 'updated' : 'added'}.` 
    });
  };

  const handleEdit = (item: BloodInventoryItem) => {
    setEditingItem(item);
    form.reset({
      bloodGroup: item.bloodGroup,
      units: item.units,
      expiryDate: item.expiryDate.split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    form.reset({
      bloodGroup: 'O+',
      units: 0,
      expiryDate: '',
    });
    setIsDialogOpen(true);
  };

  const criticalItems = inventory.filter(i => i.stockLevel === 'critical' || i.stockLevel === 'low');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blood Inventory</h1>
          <p className="text-muted-foreground">Manage your blood stock levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Update Stock' : 'Add Blood Stock'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!!editingItem}
                      >
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
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units Available</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingItem ? 'Update Stock' : 'Add Stock'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Critical Alerts */}
      {criticalItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {criticalItems.map((item) => (
                <Badge 
                  key={item.id} 
                  variant="outline" 
                  className="border-destructive text-destructive"
                >
                  {item.bloodGroup}: {item.units} units
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BLOOD_GROUPS.map((group) => {
          const item = inventory.find(i => i.bloodGroup === group);
          const units = item?.units || 0;
          const stockLevel = getStockLevel(units);

          return (
            <Card 
              key={group}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                stockLevel === 'critical' ? 'border-destructive/50' :
                stockLevel === 'low' ? 'border-blood-warning/50' : ''
              }`}
              onClick={() => item && handleEdit(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold">{group}</span>
                  {getStockBadge(stockLevel)}
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{units}</div>
                  <div className="text-sm text-muted-foreground">units available</div>
                </div>
                {item && (
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Expires: {new Date(item.expiryDate).toLocaleDateString()}
                  </div>
                )}
                {!item && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(null);
                      form.reset({ bloodGroup: group, units: 0, expiryDate: '' });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Stock
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
