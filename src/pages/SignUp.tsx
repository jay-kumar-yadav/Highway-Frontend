import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { formValidationRules } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import Wal from "../assets/wal.jpg";

interface SignUpForm {
  name: string;
  email: string;
  dateOfBirth: string;
  agreeToTerms: boolean;
}

const SignUp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [lastOtpRequest, setLastOtpRequest] = useState<Date | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignUpForm>({
    mode: 'onChange'
  });

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        dateOfBirth: data.dateOfBirth || undefined
      });

      setUserEmail(data.email);
      setShowOTP(true);
      toast.success('Registration successful! Please check your email for OTP verification.');
    } catch (error: any) {
      
      // Handle specific validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const emailError = errors.find((err: any) => err.path === 'email');
        if (emailError && emailError.msg.includes('already exists')) {
          toast.error('This email is already registered. Please use a different email or try signing in instead.');
        } else {
          toast.error(error.response?.data?.message || 'Registration failed');
        }
      } else {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
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
                  Back to Sign Up
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
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign up</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your account to get started
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('name', formValidationRules.name)}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Date of Birth Field */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('dateOfBirth', formValidationRules.dateOfBirth)}
                    type="date"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

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
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                {...register('agreeToTerms', { required: 'You must agree to the terms and conditions' })}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  terms and conditions
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Get OTP'}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                If you're getting "email already exists" error, try signing in instead.
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

export default SignUp;
