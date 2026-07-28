import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForgotPasswordMutation } from '../api/authApi';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data).unwrap();
      setSent(true);
    } catch {
      // Always show success to prevent enumeration
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/10 p-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            If an account exists for <strong className="text-foreground">{getValues('email')}</strong>,
            we've sent a password reset link. Check your inbox.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn't get the email?{' '}
          <button
            onClick={() => setSent(false)}
            className="text-primary hover:underline underline-offset-4"
          >
            Try again
          </button>
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          Send reset link
        </Button>
      </form>

      <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
