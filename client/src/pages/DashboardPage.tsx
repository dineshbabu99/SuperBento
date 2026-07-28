import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  ShoppingBag,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
} from 'lucide-react';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/features/auth/store/authSlice';
import { CardSkeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { Avatar } from '@/shared/ui/avatar';
import { Logo } from '@/shared/ui/logo';
import { formatRelativeTime } from '@/shared/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const statsData = [
  {
    id: 'total-users',
    label: 'Total Users',
    value: '2,847',
    change: '+12%',
    changeType: 'increase' as const,
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'active-subscriptions',
    label: 'Active Subscriptions',
    value: '1,234',
    change: '+8.2%',
    changeType: 'increase' as const,
    icon: ShoppingBag,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    id: 'orders-today',
    label: "Today's Orders",
    value: '342',
    change: '-3.1%',
    changeType: 'decrease' as const,
    icon: Activity,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'deliveries-pending',
    label: 'Deliveries Pending',
    value: '89',
    change: '+5',
    changeType: 'increase' as const,
    icon: Truck,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

const revenueData = [
  { month: 'Jan', revenue: 42000, orders: 1200 },
  { month: 'Feb', revenue: 38000, orders: 1100 },
  { month: 'Mar', revenue: 52000, orders: 1450 },
  { month: 'Apr', revenue: 48000, orders: 1320 },
  { month: 'May', revenue: 61000, orders: 1680 },
  { month: 'Jun', revenue: 55000, orders: 1540 },
  { month: 'Jul', revenue: 67000, orders: 1820 },
];

const recentActivity = [
  {
    id: '1',
    user: { firstName: 'Priya', lastName: 'Sharma', avatarUrl: null },
    action: 'New subscription created',
    detail: 'Monthly Premium Plan — ₹2,999/mo',
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    type: 'success' as const,
  },
  {
    id: '2',
    user: { firstName: 'Arjun', lastName: 'Nair', avatarUrl: null },
    action: 'Delivery completed',
    detail: 'Route: T. Nagar → Adyar (12 stops)',
    time: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    type: 'info' as const,
  },
  {
    id: '3',
    user: { firstName: 'Kavitha', lastName: 'Rajan', avatarUrl: null },
    action: 'Purchase order raised',
    detail: 'Tomatoes × 50kg — M/s Fresh Farms',
    time: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    type: 'warning' as const,
  },
  {
    id: '4',
    user: { firstName: 'Vikram', lastName: 'Bose', avatarUrl: null },
    action: 'New user created',
    detail: 'Role: Delivery Executive',
    time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    type: 'default' as const,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-8"
    >
      {/* Welcome header */}
      <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 p-6 md:p-8 shadow-card flex justify-between items-center border border-primary/20">
        <div className="absolute inset-0 bg-grid opacity-10" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }} />
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            {greeting}, {user?.firstName}! 👋
          </h1>
          <p className="text-primary-foreground/80 text-sm max-w-md">
            Welcome to your SuperBento workspace. Here's a quick overview of your business performance today.
          </p>
        </div>
        <div className="relative z-10 hidden sm:flex bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl items-center justify-center">
           <Logo size={48} showText={false} />
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsData.map((stat) => (
          <motion.div
            key={stat.id}
            variants={itemVariants}
            whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            className="card-premium p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className={`rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          variants={itemVariants}
          className="card-premium p-6 lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Revenue Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue trend (₹)</p>
            </div>
            <Badge variant="success" dot>Live</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="card-premium p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Avatar
                  src={item.user.avatarUrl}
                  firstName={item.user.firstName}
                  lastName={item.user.lastName}
                  size="sm"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-medium text-foreground truncate">{item.action}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatRelativeTime(item.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="card-premium p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add User', icon: Users, color: 'text-blue-500 bg-blue-500/10', to: '/users' },
            { label: 'New Order', icon: ShoppingBag, color: 'text-green-500 bg-green-500/10', to: '/orders' },
            { label: 'View Deliveries', icon: Truck, color: 'text-orange-500 bg-orange-500/10', to: '/delivery' },
            { label: 'Reports', icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10', to: '/reports' },
          ].map((action) => (
            <motion.a
              key={action.label}
              href={action.to}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className={`rounded-lg p-2.5 ${action.color.split(' ')[1]}`}>
                <action.icon className={`h-5 w-5 ${action.color.split(' ')[0]}`} />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
