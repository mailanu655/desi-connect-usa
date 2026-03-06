export const dynamic = 'force-dynamic';
/**
 * Identity linking page
 * Allows logged-in users to link their WhatsApp number to their account
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import authClient from '@/lib/auth-client';

type LinkStage = 'phone_input' | 'otp_verification' | 'success';

export default function LinkIdentityPage() {
  const router = useRouter();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [stage, setStage] = useState<LinkStage>('phone_input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    try {
      setLoading(true);
      const result = await authClient.initiateIdentityLink(phoneNumber);
      setVerificationId(result.verificationId);
      setStage('otp_verification');
      setSuccess(`OTP sent to ${phoneNumber}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode || !verificationId) {
      setError('Please enter the OTP code');
      return;
    }

    try {
      setLoading(true);
      const result = await authClient.completeIdentityLink(phoneNumber, otpCode, verificationId);

      if (result.success) {
        setSuccess('Identity linked successfully!');
        setStage('success');
        // Refresh user data
        await refreshUser();
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.message || 'Failed to link identity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Your WhatsApp</h1>
            <p className="text-gray-600">Connect your WhatsApp and website accounts</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Phone Input Stage */}
          {stage === 'phone_input' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Include country code (e.g., +1 for USA)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Why link?</strong> Get notifications on WhatsApp and stay connected across all platforms.
                </p>
              </div>
            </form>
          )}

          {/* OTP Verification Stage */}
          {stage === 'otp_verification' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Verification code sent to <strong>{phoneNumber}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStage('phone_input');
                  setOtpCode('');
                  setError('');
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                Use a different number
              </button>
            </form>
          )}

          {/* Success Stage */}
          {stage === 'success' && (
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="bg-green-100 text-green-600 rounded-full p-3">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Linked!</h2>
              <p className="text-gray-600 mb-6">
                Your WhatsApp and website accounts are now connected.
              </p>
              <p className="text-sm text-gray-500">Redirecting to home...</p>
            </div>
          )}

          {/* Current User Info */}
          {user && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Logged in as <strong>{user.display_name}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
