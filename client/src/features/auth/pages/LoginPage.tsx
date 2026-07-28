import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLoginMutation } from '../api/authApi';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/toaster';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data).unwrap();
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      const message = apiError?.message || 'Invalid email or password';
      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('password')) {
        setError('root', { message });
      } else {
        console.log(message)
        toast({ title: 'Login failed', description: message, variant: 'error' });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your SuperBento ERP workspace
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Root error */}
        {errors.root && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errors.root.message}
          </motion.div>
        )}

        <Input
          {...register('email')}
          type="email"
          label="Email address"
          placeholder="you@superbento.com"
          autoComplete="email"
          autoFocus
          required
          error={errors.email?.message}
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <div className="space-y-1.5">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
        >
          Sign in
        </Button>
      </form>

      {/* Demo credentials hint */}
      <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Demo credentials</p>
        <div className="space-y-1">
          <p className="text-xs text-foreground font-mono">superadmin@superbento.com</p>
          <p className="text-xs text-foreground font-mono">SuperBento@2024!</p>
        </div>
      </div>
    </div>
  );
}
