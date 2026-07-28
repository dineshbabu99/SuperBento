import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useAppSelector } from '@/app/store';
import { selectSidebarOpen } from '@/app/selectors';
import { cn } from '@/shared/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AppSidebar isMobile={isMobile} />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-all duration-300',
          !isMobile && sidebarOpen ? 'lg:ml-64' : !isMobile ? 'lg:ml-0' : '',
        )}
      >
        {/* Header */}
        <AppHeader />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full px-4 py-6 lg:px-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
