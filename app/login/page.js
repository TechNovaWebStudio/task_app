'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CheckSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      await login({ email: data.email, password: data.password });
      router.push('/dashboard');
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side panel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-600 to-indigo-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-violet-400/10 blur-[100px]" />
        </div>

        <div className="mt-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shadow-lg border border-white/20">
              <CheckSquare className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">TodoApp</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              Premium Task <br/>Management
            </h1>
            <p className="text-lg text-indigo-100 mb-12 max-w-md leading-relaxed">
              Boost your productivity, manage tasks efficiently, and never miss a deadline again.
            </p>

            <div className="space-y-6">
              {[
                'Organize tasks with smart categories',
                'Track progress with visual reports',
                'Stay on schedule with reminders'
              ].map((feature, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                  key={i} 
                  className="flex items-center gap-4 text-indigo-50 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm max-w-md"
                >
                  <div className="p-1 rounded-full bg-indigo-400/30">
                    <CheckCircle2 className="w-6 h-6 text-indigo-200" />
                  </div>
                  <span className="text-lg font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-sm text-indigo-200/60 font-medium relative z-10"
        >
          © {new Date().getFullYear()} TodoApp Inc. All rights reserved.
        </motion.div>
      </div>

      {/* Right side login form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-white relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto lg:w-96"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl shadow-md">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight">TodoApp</span>
          </div>

          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome Back! 👋
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Please sign in to your account
            </p>
          </div>

          <div className="mt-10">
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="rounded-xl bg-red-50 p-4 border border-red-100 shadow-sm overflow-hidden"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{loginError}</h3>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`block w-full pl-11 sm:text-sm rounded-xl border ${
                      errors.email 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500 bg-gray-50/50 focus:bg-white'
                    } py-3.5 transition-colors duration-200`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <motion.p initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className={`block w-full pl-11 pr-11 sm:text-sm rounded-xl border ${
                      errors.password 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500 bg-gray-50/50 focus:bg-white'
                    } py-3.5 transition-colors duration-200`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <motion.p initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button type="button" className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-10 text-center text-sm text-gray-500 font-medium">
              Don't have an account? <span className="text-gray-800">Contact Admin</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
