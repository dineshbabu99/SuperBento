import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="space-y-2">
          <p className="text-8xl font-black text-foreground/10 select-none">404</p>
          <h1 className="text-2xl font-bold text-foreground -mt-4">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Go back
          </Button>
          <Link to="/dashboard">
            <Button leftIcon={<Home className="h-4 w-4" />}>Dashboard</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
