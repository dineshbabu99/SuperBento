import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border border-border',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
        success: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        outline: 'border border-border text-foreground',
        // Status badges
        active: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
        inactive: 'bg-muted text-muted-foreground border border-border',
        suspended: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
        pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
      },
      size: {
        sm: 'px-2 py-0 text-[10px]',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'active' || variant === 'success' ? 'bg-green-500' :
            variant === 'destructive' || variant === 'suspended' ? 'bg-red-500' :
            variant === 'warning' || variant === 'pending' ? 'bg-yellow-500' :
            'bg-primary',
          )}
        />
      )}
      {children}
    </div>
  );
}

// Status badge specifically for user/record status
interface StatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending',
  };

  const labelMap: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SUSPENDED: 'Suspended',
    PENDING_VERIFICATION: 'Pending',
  };

  return (
    <Badge variant={variantMap[status]} dot>
      {labelMap[status] ?? status}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
