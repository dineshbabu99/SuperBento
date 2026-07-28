import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/utils';
import { Logo } from '@/shared/ui/logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background bg-grid">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-accent" />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-accent/30 blur-3xl animate-pulse delay-1000" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 bg-background/90 p-4 rounded-xl w-fit">
            <Logo size={48} showText={true} />
          </div>

          {/* Hero content */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold text-white leading-tight">
                Manage your entire
                <br />
                <span className="text-white/80">meal business</span>
                <br />
                in one place
              </h1>
              <p className="text-white/70 text-lg max-w-sm">
                From kitchen production to doorstep delivery — SuperBento ERP keeps everything running smoothly.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { value: '10K+', label: 'Meals/day' },
                { value: '98%', label: 'On-time delivery' },
                { value: '5★', label: 'Customer rating' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} SuperBento. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center mb-8">
          <Logo size={40} showText={true} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
