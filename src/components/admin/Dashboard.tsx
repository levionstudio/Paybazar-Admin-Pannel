import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  TrendingUp, 
  UserCheck, 
  AlertTriangle,
  Activity,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const transactionData = [
  { month: 'Jan', dmt: 45000, aeps: 35000, bill: 25000 },
  { month: 'Feb', dmt: 52000, aeps: 42000, bill: 28000 },
  { month: 'Mar', dmt: 48000, aeps: 38000, bill: 32000 },
  { month: 'Apr', dmt: 61000, aeps: 45000, bill: 35000 },
  { month: 'May', dmt: 55000, aeps: 48000, bill: 38000 },
  { month: 'Jun', dmt: 67000, aeps: 52000, bill: 42000 },
];

const commissionData = [
  { name: 'DMT', value: 45, color: 'hsl(205 85% 15%)' },
  { name: 'AEPS', value: 30, color: 'hsl(205 85% 25%)' },
  { name: 'Bill Payments', value: 25, color: 'hsl(205 85% 35%)' },
];

const recentActivities = [
  { id: 1, user: 'RT001', action: 'DMT Transaction', amount: '₹25,000', status: 'success', time: '2 mins ago' },
  { id: 2, user: 'DT005', action: 'AEPS Withdrawal', amount: '₹10,000', status: 'success', time: '5 mins ago' },
  { id: 3, user: 'RT003', action: 'Bill Payment', amount: '₹5,500', status: 'pending', time: '8 mins ago' },
  { id: 4, user: 'RT007', action: 'KYC Submitted', amount: '-', status: 'review', time: '15 mins ago' },
];

const stats = [
  {
    title: 'Total Revenue',
    value: '₹0',
    change: '+0%',
    icon: DollarSign,
    description: 'From last month',
    color: 'text-success'
  },
  {
    title: 'Active Users',
    value: '0',
    change: '+0%',
    icon: Users,
    description: 'Retailers & Distributors',
    color: 'text-primary'
  },
  {
    title: 'Total Transactions',
    value: '0',
    change: '0%',
    icon: CreditCard,
    description: 'This month',
    color: 'text-accent'
  },
  {
    title: 'Pending KYCs',
    value: '0',
    change: '-0%',
    icon: UserCheck,
    description: 'Awaiting review',
    color: 'text-warning'
  },
];

export function Dashboard() {
  return (
  <div className="container mx-auto px-4 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline">Export Report</Button>
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-poppins text-foreground">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}>
                    {stat.change}
                  </span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction Trends */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="font-poppins">Transaction Trends</CardTitle>
            <CardDescription>Monthly transaction volume by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="dmt" stackId="1" stroke="hsl(205 85% 15%)" fill="hsl(205 85% 15% / 0.8)" />
                <Area type="monotone" dataKey="aeps" stackId="1" stroke="hsl(205 85% 25%)" fill="hsl(205 85% 25% / 0.8)" />
                <Area type="monotone" dataKey="bill" stackId="1" stroke="hsl(205 85% 35%)" fill="hsl(205 85% 35% / 0.8)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-poppins">Commission Distribution</CardTitle>
            <CardDescription>Revenue share by service</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commissionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {commissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="font-poppins flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest transactions and user activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium text-foreground">{activity.user}</div>
                      <Badge 
                        variant={
                          activity.status === 'success' ? 'default' : 
                          activity.status === 'pending' ? 'secondary' : 'outline'
                        }
                        className={
                          activity.status === 'success' ? 'bg-success text-success-foreground' :
                          activity.status === 'pending' ? 'bg-warning text-warning-foreground' :
                          'border-primary text-primary'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{activity.amount}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <FileText className="mr-2 h-4 w-4" />
              View All Logs
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-poppins flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">23 KYCs Pending</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Review pending verifications</p>
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  Review KYCs
                </Button>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">User Management</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Manage retailer & distributor access</p>
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  Manage Users
                </Button>
              </div>

              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Commission Report</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Generate commission statements</p>
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}