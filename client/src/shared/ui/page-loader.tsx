import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';

interface PageLoaderProps {
  className?: string;
  text?: string;
}

export function PageLoader({ className, text }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3',
        className,
      )}
    >
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="absolute inset-0 rounded-full blur-lg bg-primary/20 animate-pulse" />
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white text-sm font-bold">SB</span>
        </div>
        <span className="text-xl font-bold text-foreground">SuperBento ERP</span>
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading your workspace...</p>
    </div>
  );
}
