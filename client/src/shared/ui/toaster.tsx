import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-[380px] flex-col gap-2',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

const toastConfig: Record<ToastVariant, { icon: React.ReactNode; className: string }> = {
  default: {
    icon: <Info className="h-4 w-4" />,
    className: 'border-border bg-card text-foreground',
  },
  success: {
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    className: 'border-green-500/20 bg-green-500/10 text-foreground',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-destructive" />,
    className: 'border-destructive/20 bg-destructive/10 text-foreground',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    className: 'border-yellow-500/20 bg-yellow-500/10 text-foreground',
  },
  info: {
    icon: <Info className="h-4 w-4 text-primary" />,
    className: 'border-primary/20 bg-primary/10 text-foreground',
  },
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    variant?: ToastVariant;
    title?: string;
    description?: string;
  }
>(({ className, variant = 'default', title, description, children, ...props }, ref) => {
  const config = toastConfig[variant];

  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg',
        'transition-all duration-300',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
        'data-[state=open]:slide-in-from-bottom-4',
        config.className,
        className,
      )}
      {...props}
    >
      <div className="shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 space-y-1 min-w-0">
        {title && (
          <ToastPrimitive.Title className="text-sm font-semibold">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-xs text-muted-foreground">
            {description}
          </ToastPrimitive.Description>
        )}
        {children}
      </div>
      <ToastPrimitive.Close className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors -mr-1 -mt-1">
        <X className="h-3.5 w-3.5" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

// ─── Toast Hook ────────────────────────────────────────

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastState = ToastOptions & { id: string; open: boolean };

const toastState: React.MutableRefObject<{
  toasts: ToastState[];
  setToasts: React.Dispatch<React.SetStateAction<ToastState[]>>;
} | null> = { current: null };

export function useToast() {
  const toast = (options: ToastOptions) => {
    if (!toastState.current) return;
    const id = Math.random().toString(36).slice(2);
    toastState.current.setToasts((prev) => [
      ...prev,
      { ...options, id, open: true },
    ]);
    setTimeout(() => {
      toastState.current?.setToasts((prev) =>
        prev.filter((t) => t.id !== id),
      );
    }, options.duration ?? 4000);
  };

  return {
    toast,
    success: (title: string, description?: string) =>
      toast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      toast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) =>
      toast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) =>
      toast({ title, description, variant: 'info' }),
  };
}

// ─── Toaster Provider ──────────────────────────────────

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  React.useEffect(() => {
    toastState.current = { toasts, setToasts };
  });

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => {
            if (!open) {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }
          }}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
