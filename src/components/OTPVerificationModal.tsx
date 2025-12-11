import { useState, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<void>;
}

export default function OTPVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerify,
  onResend,
}: OTPVerificationModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await onVerify(code);
      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        setCode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);
    setCode('');

    try {
      await onResend();
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        <div className="relative h-2 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light tracking-tight text-gray-900">
              Verify Your Phone Number
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-2 font-light">
            A verification code has been sent to your phone.
          </p>
          <p className="text-sm text-gray-500 mb-6 font-light">
            Please enter it below to submit your parking permit request.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <p className="text-sm text-blue-900 font-medium">
              {phoneNumber}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:outline-none transition-all duration-200"
                maxLength={6}
                disabled={isVerifying}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-red-800 text-sm font-light">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-light transition-all duration-300"
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className={`flex-1 py-3 px-6 rounded-xl font-light transition-all duration-300 ${
                  isVerifying || code.length !== 6
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-900/30'
                }`}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Verifying...
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-sm text-blue-900 hover:text-blue-700 font-light transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                'Resend verification code'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

