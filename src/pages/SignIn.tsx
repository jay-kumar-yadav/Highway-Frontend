import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { formValidationRules } from '../utils/validation';
import Wal from "../assets/wal.jpg";


interface SignInForm {
  email: string;
  rememberMe: boolean;
}

const SignIn: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [lastOtpRequest, setLastOtpRequest] = useState<Date | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInForm>({
    mode: 'onChange'
  });

  useEffect(() => {
    // Check if user came from Google OAuth
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/login', {
        email: data.email
      });

      setUserEmail(data.email);
      setShowOTP(true);
      toast.success('OTP sent to your email for login verification');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleOTPRequest = async () => {
    if (!userEmail) {
      toast.error('Please enter your email first');
      return;
    }

    // Rate limiting: Check if user has exceeded the limit
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    if (lastOtpRequest && lastOtpRequest > oneMinuteAgo) {
      const remainingTime = Math.ceil((lastOtpRequest.getTime() + 60 * 1000 - now.getTime()) / 1000);
      toast.error(`Please wait ${remainingTime} seconds before requesting another OTP`);
      return;
    }

    if (otpRequestCount >= 5) {
      toast.error('Too many OTP requests. Please try again later.');
      return;
    }

    try {
      await api.post('/auth/request-otp', { email: userEmail });
      setOtpRequestCount(prev => prev + 1);
      setLastOtpRequest(now);
      toast.success('OTP sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleOTPVerification = async () => {
    if (!otp || !userEmail) {
      toast.error('Please enter OTP and email');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP must be exactly 6 digits');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error('OTP must contain only numbers');
      return;
    }

    try {
      const response = await api.post('/auth/verify-otp', {
        email: userEmail,
        otp: otp
      });

      login(response.data.token, response.data.user);
      toast.success('Email verified successfully!');
      navigate('/welcome');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - OTP Form */}
        <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Verify OTP</h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter the OTP sent to {userEmail}
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <div className="mt-1">
                  <input
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
                      setOtp(value);
                    }}
                    type="text"
                    maxLength={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={handleOTPRequest}
                    disabled={otpRequestCount >= 5}
                    className={`text-sm font-medium ${
                      otpRequestCount >= 5 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-primary-600 hover:text-primary-500'
                    }`}
                  >
                    {otpRequestCount >= 5 ? 'OTP limit reached' : 'Resend OTP'}
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={handleOTPVerification}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Verify OTP
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowOTP(false)}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Background Image */}
        <div className="hidden lg:block lg:w-1/2">
          <div 
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${Wal})` }}
          >
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! Please sign in to your account
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email', formValidationRules.email)}
                    type="email"
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Keep me logged in
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending OTP...' : 'Get OTP'}
              </button>
            </div>

            {/* Google Sign In */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

        {/* Right side - Background Image */}
        <div className="hidden lg:block lg:w-1/2">
          <div 
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${Wal})` }}
          >
          </div>
        </div>
    </div>
  );
};

export default SignIn;
