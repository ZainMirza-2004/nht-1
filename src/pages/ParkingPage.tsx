import { useState, FormEvent } from 'react';
import { Car } from 'lucide-react';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from '../components/DatePicker';
import HierarchicalPropertySelect from '../components/HierarchicalPropertySelect';
import OTPVerificationModal from '../components/OTPVerificationModal';
import StripeCheckout from '../components/StripeCheckout';
import { formatPhoneToE164, formatPhoneForDisplay, getPhoneValidationError } from '../lib/phone-utils';

type PermitType = 'free' | 'paid';

export default function ParkingPage() {
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [pendingPermitData, setPendingPermitData] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    vehicleMake: '',
    registration: '',
    propertyName: '',
    permitType: 'free' as PermitType,
    permitDate: '',
    numberOfNights: 1,
  });

  const handleOTPRequest = async () => {
    try {
      // Format phone number to E.164 before sending
      const formattedPhone = formatPhoneToE164(formData.phone);
      if (!formattedPhone) {
        const errorMsg = getPhoneValidationError(formData.phone);
        throw new Error(errorMsg || 'Invalid phone number format');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase is not configured.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/request-parking-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification code');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send verification code');
    }
  };

  const handleOTPVerify = async (code: string): Promise<boolean> => {
    try {
      // Format phone number to E.164 before sending
      const formattedPhone = formatPhoneToE164(formData.phone);
      if (!formattedPhone) {
        const errorMsg = getPhoneValidationError(formData.phone);
        throw new Error(errorMsg || 'Invalid phone number format');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase is not configured.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/verify-parking-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          code: code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid verification code');
      }

      const result = await response.json();
      
      if (result.verified) {
        // Now submit the permit request
        await submitFreePermitRequest();
        return true;
      }
      
      return false;
    } catch (error: any) {
      throw error;
    }
  };

  const submitFreePermitRequest = async () => {
    try {
      // Format phone number to E.164 before sending
      const formattedPhone = formatPhoneToE164(formData.phone);
      if (!formattedPhone) {
        const errorMsg = getPhoneValidationError(formData.phone);
        throw new Error(errorMsg || 'Invalid phone number format');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase is not configured.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-parking-permit-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formattedPhone,
          vehicleMake: formData.vehicleMake,
          registration: formData.registration,
          propertyName: formData.propertyName,
          permitType: 'free',
          permitDate: formData.permitDate,
          numberOfNights: 1, // Free permits are always 1 night
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus('success');
        setShowOTPModal(false);
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          vehicleMake: '',
          registration: '',
          propertyName: '',
          permitType: 'free',
          permitDate: '',
          numberOfNights: 1,
        });
      } else {
        throw new Error(result.message || 'Failed to submit request');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit request');
      setSubmitStatus('error');
      setShowOTPModal(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.permitDate) {
      setErrorMessage('Please select a date');
      setSubmitStatus('error');
      return;
    }

    // Validate phone number if required (for free permits)
    if (formData.permitType === 'free') {
      const phoneError = getPhoneValidationError(formData.phone);
      if (phoneError) {
        setErrorMessage(phoneError);
        setSubmitStatus('error');
        return;
      }
    }

    if (formData.permitType === 'free') {
      // For free permits, show OTP modal first
      setLoading(true);
      try {
        await handleOTPRequest();
        setPendingPermitData({ ...formData });
        setShowOTPModal(true);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to send verification code');
        setSubmitStatus('error');
      } finally {
        setLoading(false);
      }
    } else {
      // For paid permits, show Stripe checkout
      setPendingPermitData({ ...formData });
      setShowStripeCheckout(true);
    }
  };

  const handlePaidPermitSuccess = async () => {
    try {
      // Format phone number to E.164 before sending
      const formattedPhone = pendingPermitData.phone 
        ? formatPhoneToE164(pendingPermitData.phone)
        : '';
      
      if (pendingPermitData.phone && !formattedPhone) {
        const errorMsg = getPhoneValidationError(pendingPermitData.phone);
        throw new Error(errorMsg || 'Invalid phone number format');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase is not configured.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-paid-parking-permit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: pendingPermitData.fullName,
          email: pendingPermitData.email,
          phone: formattedPhone || '',
          vehicleMake: pendingPermitData.vehicleMake,
          registration: pendingPermitData.registration,
          propertyName: pendingPermitData.propertyName,
          permitDate: pendingPermitData.permitDate,
          numberOfNights: pendingPermitData.numberOfNights,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create permit');
      }

      const result = await response.json();
      
      setShowStripeCheckout(false);
      
      // Build confirmation URL with all necessary data
      const confirmationUrl = new URL('/booking-confirmation', window.location.origin);
      confirmationUrl.searchParams.set('serviceType', 'parking');
      
      // Use database ID if available, otherwise use permitId
      if (result.id) {
        confirmationUrl.searchParams.set('bookingId', result.id);
      } else if (result.permitId) {
        confirmationUrl.searchParams.set('permitId', result.permitId);
      }
      
      // Add permit details to URL as fallback (in case database lookup fails)
      if (pendingPermitData) {
        confirmationUrl.searchParams.set('fullName', encodeURIComponent(pendingPermitData.fullName || ''));
        confirmationUrl.searchParams.set('email', encodeURIComponent(pendingPermitData.email || ''));
        confirmationUrl.searchParams.set('propertyName', encodeURIComponent(pendingPermitData.propertyName || ''));
        confirmationUrl.searchParams.set('permitDate', encodeURIComponent(pendingPermitData.permitDate || ''));
        confirmationUrl.searchParams.set('numberOfNights', String(pendingPermitData.numberOfNights || 1));
        if (result.permitId) {
          confirmationUrl.searchParams.set('permitId', result.permitId);
        }
      }
      
      setPendingPermitData(null);
      
      // Redirect to confirmation page
      window.location.href = confirmationUrl.toString();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create permit');
      setSubmitStatus('error');
      setShowStripeCheckout(false);
    }
  };

  const totalPrice = formData.permitType === 'paid' ? formData.numberOfNights * 1 : 0;

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        .stagger-4 { animation-delay: 0.4s; }
      `}</style>
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out hover:scale-105"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1920&h=1080&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-md mb-8 transition-transform duration-500 hover:scale-110 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            <Car className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.3)' }}>
            Parking Permit
          </h1>
          <div className="h-px w-16 bg-white/60 mx-auto mb-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"></div>
          <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto font-light tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)' }}>
            Secure your parking arrangements with ease
          </p>
        </div>
      </section>

      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(218,165,32,0.03),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,69,19,0.02),transparent_50%)]"></div>
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-visible">
            <div className="relative h-2 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
              <div className="absolute inset-0 shimmer"></div>
            </div>
            
            <div className="p-10 md:p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-6 transition-transform duration-500 hover:scale-110">
                  <Car className="h-8 w-8 text-blue-900" strokeWidth={1.5} />
                </div>
                <h2 className="text-4xl font-light tracking-tight text-gray-900 mb-3">
                  Request Your Permit
                </h2>
                <p className="text-base text-gray-500 font-light">
                  Complete the form below to secure your parking arrangements
                </p>
              </div>

              <div className="bg-amber-50/50 rounded-2xl p-6 mb-8 border border-amber-100">
                <h3 className="text-lg font-light tracking-wide text-gray-900 mb-3">
                  About Parking Permits
                </h3>
                <div className="space-y-3 text-gray-600 leading-relaxed text-sm font-light">
                  <p>
                    <strong className="font-medium text-gray-900">Free Parking Permit (Driveway):</strong> Limited to 1 car per booking. Requires property manager approval and phone verification.
                  </p>
                  <p>
                    <strong className="font-medium text-gray-900">Paid Parking Permit (On-Street):</strong> Unlimited cars. Instant payment via Stripe - no approval needed.
                  </p>
                </div>
              </div>

              {submitStatus === 'success' && (
                <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-2xl animate-scale-in">
                  <p className="text-green-800 text-center font-light leading-relaxed">
                    {formData.permitType === 'paid' 
                      ? 'Your parking permit has been created successfully! A confirmation email with your permit details has been sent to your email address.'
                      : 'Your parking permit request has been submitted successfully! We\'ll review your request and email you within 24 hours with your permit details.'}
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl animate-scale-in">
                  <p className="text-red-800 text-center font-light leading-relaxed">
                    {errorMessage || 'Failed to send your request. Please try again or contact us directly.'}
                  </p>
                  <p className="text-red-600 text-sm text-center mt-2 font-light">
                    If this problem persists, please contact us directly at parking@nhtestates.com
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-7">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                    {formData.permitType === 'free' && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      // Allow user to type freely, we'll format on submit
                      setFormData({ ...formData, phone: e.target.value });
                      // Clear error when user starts typing
                      if (submitStatus === 'error' && errorMessage?.includes('phone')) {
                        setErrorMessage('');
                        setSubmitStatus('idle');
                      }
                    }}
                    onBlur={(e) => {
                      // Format on blur for better UX
                      const formatted = formatPhoneToE164(e.target.value);
                      if (formatted && formData.phone) {
                        // Update with formatted version for display
                        setFormData({ ...formData, phone: formatPhoneForDisplay(formatted) });
                      }
                    }}
                    required={formData.permitType === 'free'}
                    placeholder="+44 1234 567890 or 01234567890"
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200
                      ${submitStatus === 'error' && errorMessage?.includes('phone')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-900 focus:border-blue-900'
                      }
                      focus:ring-2 focus:outline-none bg-white`}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter UK number (01234567890) or international format (+44 1234 567890)
                  </p>
                  {submitStatus === 'error' && errorMessage?.includes('phone') && (
                    <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                  )}
                </div>

                <Input
                  label="Vehicle Make & Model"
                  type="text"
                  placeholder="e.g., Tesla Model 3, BMW X5"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  required
                />

                <Input
                  label="Registration Number"
                  type="text"
                  placeholder="e.g., AB12 CDE"
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                  required
                />

                <HierarchicalPropertySelect
                  value={formData.propertyName}
                  onChange={(value) => setFormData({ ...formData, propertyName: value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permit Type <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.permitType === 'free'
                        ? 'border-blue-900 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="permitType"
                        value="free"
                        checked={formData.permitType === 'free'}
                        onChange={(e) => setFormData({ ...formData, permitType: e.target.value as PermitType })}
                        className="mt-1 w-4 h-4 text-blue-900 focus:ring-blue-900"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">FREE PARKING PERMIT (Driveway)</div>
                        <div className="text-sm text-gray-600 mt-1">Limit 1 car only</div>
                      </div>
                    </label>
                    <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.permitType === 'paid'
                        ? 'border-blue-900 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="permitType"
                        value="paid"
                        checked={formData.permitType === 'paid'}
                        onChange={(e) => setFormData({ ...formData, permitType: e.target.value as PermitType })}
                        className="mt-1 w-4 h-4 text-blue-900 focus:ring-blue-900"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">PAID PARKING PERMIT (On-Street Parking)</div>
                        <div className="text-sm text-gray-600 mt-1">Unlimited cars • Instant payment • No approval needed</div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.permitType === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How many nights are you staying? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.numberOfNights}
                      onChange={(e) => setFormData({ ...formData, numberOfNights: parseInt(e.target.value) })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:outline-none bg-white transition-all duration-200"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((nights) => (
                        <option key={nights} value={nights}>
                          {nights} {nights === 1 ? 'night' : 'nights'}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Total Price:</span>
                        <span className="text-2xl font-serif font-bold text-blue-900">£{totalPrice}</span>
                      </div>

                    </div>
                  </div>
                )}

                <DatePicker
                  label="Date"
                  value={formData.permitDate}
                  onChange={(date) => setFormData({ ...formData, permitDate: date })}
                  minDate={new Date().toISOString().split('T')[0]}
                  required
                />

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-5 rounded-xl font-light text-base tracking-wide transition-all duration-300 ${
                      loading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-900 text-white hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </span>
                    ) : formData.permitType === 'paid' ? (
                      'Proceed to Payment'
                    ) : (
                      'Submit Permit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-500 mb-6 font-light">Need immediate assistance?</p>
            <div className="space-y-4 bg-gradient-to-br from-stone-50 to-amber-50/30 p-8 rounded-2xl border border-stone-200 max-w-md mx-auto">
              <div className="group">
                <p className="text-xs font-medium tracking-wider text-gray-500 uppercase mb-2">Email</p>
                <a
                  href="mailto:parking@nhtestates.com"
                  className="text-lg text-gray-900 hover:text-amber-700 font-light transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  parking@nhtestates.com
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent"></div>
              <div className="group">
                <p className="text-xs font-medium tracking-wider text-gray-500 uppercase mb-2">Phone</p>
                <a
                  href="tel:+441234567890"
                  className="text-lg text-gray-900 hover:text-amber-700 font-light transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  +44 7767 992108
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingPermitData(null);
        }}
        phoneNumber={formatPhoneToE164(formData.phone) || formData.phone}
        onVerify={handleOTPVerify}
        onResend={handleOTPRequest}
      />

      <StripeCheckout
        isOpen={showStripeCheckout}
        onClose={() => {
          setShowStripeCheckout(false);
          setPendingPermitData(null);
        }}
        amount={totalPrice}
        serviceType="parking"
        bookingId={pendingPermitData ? JSON.stringify({
          fullName: pendingPermitData.fullName,
          email: pendingPermitData.email,
          phone: pendingPermitData.phone,
          vehicleMake: pendingPermitData.vehicleMake,
          registration: pendingPermitData.registration,
          propertyName: pendingPermitData.propertyName,
          permitDate: pendingPermitData.permitDate,
          numberOfNights: pendingPermitData.numberOfNights,
        }) : undefined}
        customerName={pendingPermitData?.fullName}
        customerEmail={pendingPermitData?.email}
        onSuccess={handlePaidPermitSuccess}
      />
    </div>
  );
}
