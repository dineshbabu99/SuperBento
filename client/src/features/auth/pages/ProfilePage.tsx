import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Camera } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { selectCurrentUser, updateProfile } from '@/features/auth/store/authSlice';
import { useUpdateProfileMutation, useChangePasswordMutation } from '@/features/auth/api/authApi';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Avatar } from '@/shared/ui/avatar';
import { useToast } from '@/shared/ui/toaster';
import { Badge } from '@/shared/ui/badge';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState(false);
  const [updateProfileMutation, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const updated = await updateProfileMutation(data).unwrap();
      dispatch(updateProfile(updated));
      toast({ title: 'Profile updated successfully', variant: 'success' });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ title: 'Failed to update profile', description: err?.message, variant: 'error' });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }).unwrap();
      toast({ title: 'Password changed successfully', description: 'You will need to log in again on other devices.', variant: 'success' });
      passwordForm.reset();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ title: 'Failed to change password', description: err?.message, variant: 'error' });
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and security settings.</p>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 space-y-6"
      >
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Personal Information</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              src={user?.avatarUrl}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="xl"
            />
            <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-md">
              <Camera className="h-3 w-3 text-white" />
            </button>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.role && <Badge variant="default">{user.role.name}</Badge>}
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...profileForm.register('firstName')}
              label="First name"
              placeholder="John"
              error={profileForm.formState.errors.firstName?.message}
            />
            <Input
              {...profileForm.register('lastName')}
              label="Last name"
              placeholder="Doe"
              error={profileForm.formState.errors.lastName?.message}
            />
          </div>
          <Input
            label="Email address"
            value={user?.email ?? ''}
            disabled
            hint="Email cannot be changed. Contact admin if needed."
          />
          <Input
            {...profileForm.register('phoneNumber')}
            label="Phone number"
            placeholder="+91 98765 43210"
            type="tel"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={updatingProfile}>Save changes</Button>
          </div>
        </form>
      </motion.div>

      {/* Password card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-6 space-y-6"
      >
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Change Password</h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            {...passwordForm.register('currentPassword')}
            type={showPasswords ? 'text' : 'password'}
            label="Current password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            {...passwordForm.register('newPassword')}
            type={showPasswords ? 'text' : 'password'}
            label="New password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            {...passwordForm.register('confirmPassword')}
            type={showPasswords ? 'text' : 'password'}
            label="Confirm new password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="rounded"
              />
              Show passwords
            </label>
            <Button type="submit" loading={changingPassword}>
              Change password
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
