import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useResetPasswordMutation } from '../api/authApi';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/toaster';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
      message: 'Must contain uppercase, lowercase, number, and special character',
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-xl font-bold text-foreground">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground">This reset link is invalid or has expired.</p>
        <Link to="/forgot-password">
          <Button variant="outline">Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/10 p-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Password reset!</h1>
          <p className="text-sm text-muted-foreground">Your password has been updated. Sign in with your new password.</p>
        </div>
        <Button onClick={() => navigate('/login')} className="w-full" size="lg">
          Sign in now
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword({ token, password: data.password }).unwrap();
      setSuccess(true);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast({ title: 'Reset failed', description: apiError?.message ?? 'This reset link may have expired.', variant: 'error' });

    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="New password"
          placeholder="••••••••"
          required
          error={errors.password?.message}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Input
          {...register('confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          label="Confirm password"
          placeholder="••••••••"
          required
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="h-4 w-4" />}
        />
        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
