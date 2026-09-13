'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Validate all required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password strength
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const name = `${formData.firstName} ${formData.lastName}`.trim();

      const result = await signUp({
        email: formData.email,
        password: formData.password,
        name
      });

      if (!result.success) {
        setError(result.error || 'Could not create the account.');
        return;
      }

      if (result.needsEmailConfirmation) {
        setSuccess('Account created. Check your email to confirm it, then sign in.');
        return;
      }

      setSuccess('Account created successfully! Redirecting...');
      router.replace('/');
    } catch {
      setError('Could not create your account right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-ink-900 px-5 py-16 md:px-8 md:py-24">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="mb-8 text-center">
          <p className="eyebrow text-zari-500">Account</p>
          <div className="rule-zari mx-auto mt-4 w-16" />
          <h1 className="mt-5 font-display text-h1 text-paper">Join KabirClub</h1>
          <p className="mt-3 text-body text-paper-muted">Create your account to start shopping</p>
        </div>

        {/* Signup Form */}
        <div className="rounded-plate border border-ink-700 bg-ink-800 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p
                role="alert"
                className="rounded-control bg-madder px-4 py-3 text-body-sm text-paper"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="rounded-control bg-neem px-4 py-3 text-body-sm text-paper"
              >
                {success}
              </p>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-body-sm font-medium text-paper-muted"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="field-ink"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-body-sm font-medium text-paper-muted"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="field-ink"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-body-sm font-medium text-paper-muted"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="field-ink"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Fields */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-body-sm font-medium text-paper-muted"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="field-ink"
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-body-sm font-medium text-paper-muted"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="field-ink"
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded-xs accent-zari-500"
                required
              />
              <label htmlFor="terms" className="text-body-sm text-paper-muted">
                I agree to the <span className="text-zari-500">Terms of Service</span> and{' '}
                <span className="text-zari-500">Privacy Policy</span>
              </label>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={isLoading ? 'btn-cart-disabled' : 'btn-cart'}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink-700"></div>
            <span className="eyebrow text-paper-muted">or</span>
            <div className="h-px flex-1 bg-ink-700"></div>
          </div>

          {/* Social Signup Buttons */}
          <div className="space-y-3">
            <button className="inline-flex w-full items-center justify-center gap-3 rounded-control border border-ink-faint bg-transparent px-4 py-4 text-body font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:border-paper-muted hover:bg-ink-700 active:translate-y-px">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>

            <button className="inline-flex w-full items-center justify-center gap-3 rounded-control border border-ink-faint bg-transparent px-4 py-4 text-body font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:border-paper-muted hover:bg-ink-700 active:translate-y-px">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Sign up with Facebook</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-body-sm text-paper-muted">
              Already have an account?{' '}
              <Link
                href="/login"
                className="thread-link-ink font-medium text-zari-500 hover:text-zari-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
