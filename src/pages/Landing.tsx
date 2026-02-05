import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Building2, Droplets, ArrowRight, AlertCircle } from 'lucide-react';
import { getRequests, getUsers } from '@/lib/storage';

export default function Landing() {
  const [stats, setStats] = useState({ activeRequests: 0, availableDonors: 0, organizations: 0 });

  useEffect(() => {
    const requests = getRequests();
    const users = getUsers();
    
    const activeRequests = requests.filter(r => r.status === 'pending').length;
    const availableDonors = users.filter(u => {
      if (u.role !== 'donor') return false;
      if (!u.cooldownEndDate) return true;
      return new Date(u.cooldownEndDate) < new Date();
    }).length;
    const organizations = users.filter(u => u.role === 'organization').length;

    setStats({ activeRequests, availableDonors, organizations });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-blood-success/5" />
        <nav className="relative container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BloodLink</span>
          </div>
          <Link to="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </nav>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              Emergency Blood Coordination
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Every Drop <span className="text-primary">Saves Lives</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with donors, hospitals, and blood banks in real-time. 
              Whether you need blood urgently or want to donate, BloodLink bridges the gap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register?role=receiver">
                <Button size="lg" className="w-full sm:w-auto gap-2 animate-pulse-emergency">
                  <AlertCircle className="h-5 w-5" />
                  I Need Blood
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register?role=donor">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-blood-success text-blood-success hover:bg-blood-success hover:text-white">
                  <Heart className="h-5 w-5" />
                  I Want to Donate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="py-12 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-blood-emergency/20 bg-blood-emergency/5">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stats.activeRequests}</div>
                <div className="text-muted-foreground">Active Requests</div>
              </CardContent>
            </Card>
            <Card className="border-blood-success/20 bg-blood-success/5">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-blood-success mb-2">{stats.availableDonors}</div>
                <div className="text-muted-foreground">Available Donors</div>
              </CardContent>
            </Card>
            <Card className="border-blood-matched/20 bg-blood-matched/5">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-blood-matched mb-2">{stats.organizations}</div>
                <div className="text-muted-foreground">Partner Organizations</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Role</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            BloodLink serves everyone in the blood donation ecosystem. Select your role to get started.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Receiver Card */}
            <Card className="group hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Need Blood</h3>
                <p className="text-muted-foreground mb-4">
                  Individuals or hospitals seeking blood donors for patients in need.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Create urgent blood requests
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Connect with compatible donors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Track request status in real-time
                  </li>
                </ul>
                <Link to="/register?role=receiver">
                  <Button className="w-full">Register as Receiver</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Donor Card */}
            <Card className="group hover:shadow-lg transition-shadow border-2 hover:border-blood-success">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-blood-success/10 flex items-center justify-center mb-4 group-hover:bg-blood-success/20 transition-colors">
                  <Users className="h-8 w-8 text-blood-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Donate Blood</h3>
                <p className="text-muted-foreground mb-4">
                  Generous individuals ready to save lives through blood donation.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blood-success" />
                    View compatible blood requests
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blood-success" />
                    Accept and fulfill requests
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blood-success" />
                    Track your donation history
                  </li>
                </ul>
                <Link to="/register?role=donor">
                  <Button className="w-full bg-blood-success hover:bg-blood-success/90">
                    Register as Donor
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Organization Card */}
            <Card className="group hover:shadow-lg transition-shadow border-2 hover:border-blood-matched">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-blood-matched/10 flex items-center justify-center mb-4 group-hover:bg-blood-matched/20 transition-colors">
                  <Building2 className="h-8 w-8 text-blood-matched" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Organization</h3>
                <p className="text-muted-foreground mb-4">
                  Blood banks and NGOs managing inventory and donor networks.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blood-matched" />
                    Manage blood inventory
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blood-matched" />
                    Verify hospital requests
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blood-matched" />
                    Coordinate with donors
                  </li>
                </ul>
                <Link to="/register?role=organization">
                  <Button className="w-full bg-blood-matched hover:bg-blood-matched/90">
                    Register Organization
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">BloodLink</span>
          </div>
          <p className="text-sm">Emergency Blood Coordination System</p>
        </div>
      </footer>
    </div>
  );
}
