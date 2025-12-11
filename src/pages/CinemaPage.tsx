import { useState, useEffect, FormEvent } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { getCinemaDurationMinutes, isTimeSlotAvailable, getBlockedTimeSlots } from '../lib/booking-utils';
import Input from '../components/Input';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import SuccessModal from '../components/SuccessModal';
import DatePicker from '../components/DatePicker';
import ExperienceTierSelector, { type ExperienceTier, type TierOption } from '../components/ExperienceTierSelector';
import StripeCheckout from '../components/StripeCheckout';

type CinemaBookingRow = Database['public']['Tables']['cinema_bookings']['Row'];
type CinemaBookingSelect = Pick<CinemaBookingRow, 'time_slot' | 'package_type' | 'experience_tier'>;
type CinemaBookingWithDate = Pick<CinemaBookingRow, 'booking_date' | 'time_slot' | 'package_type' | 'experience_tier'>;

// Tier configuration for Cinema
const cinemaTiers: TierOption[] = [
  {
    id: 'standard',
    name: 'Standard Experience',
    price: 65,
    description: 'Perfect for a classic movie night',
    features: [
      '3-hour private cinema session',
      'Access to premium streaming services (Netflix, Amazon Prime, Apple TV+, Hulu)',
      'Gaming: PS5, Xbox Series X, Nintendo Switch',
      'Lounge area designed for immersive movie nights',
      'Equipped kitchenette for light refreshments',
      'Full private bathroom & shower facilities',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Experience',
    price: 1,
    description: 'Most popular choice',
    badge: 'Most Popular',
    popular: true,
    features: [
      '6-hour private cinema session',
      'Access to premium streaming services (Netflix, Amazon Prime, Apple TV+, Hulu)',
      'Gaming: PS5, Xbox Series X, Nintendo Switch',
      'Lounge area designed for immersive movie nights',
      'Equipped kitchenette for light refreshments',
      'Full private bathroom & shower facilities',
      'Complimentary confectionery snacks & non-alcoholic drinks',
    ],
  },
  {
    id: 'deluxe',
    name: 'Deluxe Experience',
    price: 135,
    description: 'Ultimate luxury experience',
    priceSubtext: 'Starts from 8pm',
    features: [
      'Overnight private cinema stay',
      'Access to premium streaming services (Netflix, Amazon Prime, Apple TV+, Hulu)',
      'Gaming: PS5, Xbox Series X, Nintendo Switch',
      'Lounge area designed for immersive movie nights',
      'Equipped kitchenette for light refreshments',
      'Full private bathroom & shower facilities',
      'Complimentary confectionery snacks & non-alcoholic drinks',
      'Free 1-hour SPA session included with booking',
    ],
  },
];

// Map tiers to package names for duration calculation (backward compatibility)
const tierToPackageName: Record<ExperienceTier, string> = {
  standard: 'Standard Experience',
  premium: 'Premium Experience',
  deluxe: 'Deluxe Experience',
};

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
];

export default function CinemaPage() {
  const [selectedTier, setSelectedTier] = useState<ExperienceTier | null>('premium'); // Default to premium
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '',
  });

  // Get selected tier details
  const selectedTierDetails = selectedTier ? cinemaTiers.find(t => t.id === selectedTier) : null;

  useEffect(() => {
    if (formData.date) {
      fetchUnavailableSlots(formData.date);
    } else {
      setBookedSlots(new Set());
    }
  }, [formData.date]);

  // Fetch fully booked dates on mount and periodically
  useEffect(() => {
    fetchFullyBookedDates();
    const interval = setInterval(fetchFullyBookedDates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnavailableSlots = async (date: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        setBookedSlots(new Set());
        return;
      }

      // Use direct Supabase with overlap checking
      const { data: existingBookings, error } = await supabase
        .from('cinema_bookings')
        .select('time_slot, package_type, experience_tier')
        .eq('booking_date', date);

      if (error) {
        console.error('Error fetching bookings:', error);
        setBookedSlots(new Set());
        return;
      }

      // Calculate all blocked slots
      const blockedSlots = new Set<string>();
      for (const booking of (existingBookings || []) as CinemaBookingSelect[]) {
        // Use experience_tier if available, otherwise fall back to package_type
        let duration: number;
        if (booking.experience_tier) {
          const tierPackageName = tierToPackageName[booking.experience_tier as ExperienceTier];
          duration = getCinemaDurationMinutes(tierPackageName);
        } else {
          duration = getCinemaDurationMinutes(booking.package_type);
        }
        const blocked = getBlockedTimeSlots(date, booking.time_slot, duration, timeSlots, 30);
        blocked.forEach(slot => blockedSlots.add(slot));
      }

      setBookedSlots(blockedSlots);
    } catch (error) {
      console.error('Error fetching unavailable slots:', error);
      // On error, don't block any slots to avoid false negatives
      setBookedSlots(new Set());
    }
  };

  const fetchFullyBookedDates = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        return;
      }

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 90);
      
      const { data: bookings, error } = await supabase
        .from('cinema_bookings')
        .select('booking_date, time_slot, package_type, experience_tier')
        .gte('booking_date', today.toISOString().split('T')[0])
        .lte('booking_date', futureDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching bookings for date checking:', error);
        return;
      }

      const bookingsByDate = new Map<string, CinemaBookingSelect[]>();
      for (const booking of (bookings || []) as CinemaBookingWithDate[]) {
        const date = booking.booking_date;
        if (!bookingsByDate.has(date)) {
          bookingsByDate.set(date, []);
        }
        bookingsByDate.get(date)!.push({
          time_slot: booking.time_slot,
          package_type: booking.package_type,
          experience_tier: booking.experience_tier,
        });
      }

      const fullyBooked = new Set<string>();
      for (const [date, dateBookings] of bookingsByDate.entries()) {
        const blockedSlots = new Set<string>();
        for (const booking of dateBookings) {
          let duration: number;
          if (booking.experience_tier) {
            const tierPackageName = tierToPackageName[booking.experience_tier as ExperienceTier];
            duration = getCinemaDurationMinutes(tierPackageName);
          } else {
            duration = getCinemaDurationMinutes(booking.package_type);
          }
          const blocked = getBlockedTimeSlots(date, booking.time_slot, duration, timeSlots, 30);
          blocked.forEach(slot => blockedSlots.add(slot));
        }
        
        if (blockedSlots.size >= timeSlots.length) {
          fullyBooked.add(date);
        }
      }

      setFullyBookedDates(fullyBooked);
    } catch (error) {
      console.error('Error fetching fully booked dates:', error);
    }
  };

  const handleTierSelect = (tier: ExperienceTier) => {
    setSelectedTier(tier);
    setTimeout(() => {
      document.getElementById('booking-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation: Tier must be selected
    if (!selectedTier || !selectedTierDetails) {
      setErrorMessage('Please select an experience tier.');
      setSubmitStatus('error');
      return;
    }

    // Validation: Price must match tier (prevent tampering)
    const expectedPrice = selectedTierDetails.price;
    if (selectedTierDetails.price !== expectedPrice) {
      setErrorMessage('Invalid pricing. Please refresh and try again.');
      setSubmitStatus('error');
      return;
    }

    setLoading(true);
    setSubmitStatus('idle');

    try {
      // Use direct Supabase with overlap checking (more reliable than edge functions)
      const packageName = tierToPackageName[selectedTier];
      const requestedDuration = getCinemaDurationMinutes(packageName);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file. See the console for details.');
      }

      // Fetch all existing bookings for this date
      const { data: existingBookings, error: fetchError } = await supabase
        .from('cinema_bookings')
        .select('time_slot, package_type, experience_tier')
        .eq('booking_date', formData.date);

      if (fetchError) {
        console.error('Error fetching existing bookings:', fetchError);
        if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('Cannot connect to Supabase. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the .env file.');
        }
        throw new Error(`Failed to check availability: ${fetchError.message}`);
      }

      // Check if the requested slot is available
      // Convert existing bookings to format expected by isTimeSlotAvailable
      const bookingsForCheck = ((existingBookings || []) as CinemaBookingSelect[]).map(booking => ({
        time_slot: booking.time_slot,
        package_type: booking.experience_tier 
          ? tierToPackageName[booking.experience_tier as ExperienceTier]
          : booking.package_type,
      }));
      
      const isAvailable = isTimeSlotAvailable(
        formData.date,
        formData.timeSlot,
        requestedDuration,
        bookingsForCheck,
        getCinemaDurationMinutes,
        30 // 30-minute cleaning gap
      );

      if (!isAvailable) {
        throw new Error('This time slot is no longer available. Please select another time.');
      }

      // Create booking with 'pending' status (will be updated to 'paid' after payment)
      const bookingData = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        booking_date: formData.date,
        time_slot: formData.timeSlot,
        package_type: packageName, // Keep for backward compatibility
        package_price: selectedTierDetails.price,
        experience_tier: selectedTier, // New tier field
        status: 'pending', // Will be updated to 'paid' after successful payment
      };

      const insertResult = await (supabase
        .from('cinema_bookings')
        .insert(bookingData as any)
        .select()
        .single()) as { data: CinemaBookingRow | null; error: any };
      
      const insertedData = insertResult.data;
      const insertError = insertResult.error;

      if (insertError) {
        console.error('Error inserting booking:', insertError);
        throw new Error(`Failed to create booking: ${insertError.message}`);
      }

      if (!insertedData) {
        throw new Error('Failed to create booking: No data returned');
      }

      // Store booking ID and show Stripe checkout
      setPendingBookingId(insertedData.id);
      setShowStripeCheckout(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      
      const errorMsg = error?.message || error?.error?.message || 'Something went wrong. Please try again.';
      setErrorMessage(errorMsg);
      setSubmitStatus('error');
      
      // Show specific error message if available
      if (error.message && error.message.includes('no longer available')) {
        // Refresh slots and clear selection
        if (formData.date) {
          fetchUnavailableSlots(formData.date);
        }
        setFormData({ ...formData, timeSlot: '' });
      }
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen pt-20">
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
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
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-bounce-smooth {
          animation: bounce 2s ease-in-out infinite;
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
      <section className="relative h-screen flex justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/cinema.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
        </div>

        <div 
  className="relative z-10 text-center px-4 opacity-0 animate-fade-in-up" 
  style={{ marginTop: '15%' }}
>
  <h1 className="text-6xl md:text-7xl font-serif text-white mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.3)' }}>
    Private Cinema
  </h1>
  
  <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)' }}>
    Experience cinema luxury in your own private theater
  </p>
</div>

 
        {/* Apple-inspired Book Now Element */}
        <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 z-20 opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
          <button
            onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="group flex flex-col items-center gap-3 text-white hover:text-white transition-all duration-300"
          >
            <span className="text-sm font-light tracking-[0.2em] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)' }}>Book Now</span>
            <svg 
              className="w-6 h-6 animate-bounce-smooth" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </button>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 opacity-0 animate-fade-in-up">
            <p className="text-sm font-medium tracking-[0.2em] text-amber-800 uppercase mb-4">Experience</p>
            <h2 className="text-5xl md:text-6xl font-light tracking-tight text-gray-900 mb-6">
              Choose Your Cinema Experience
            </h2>
            <div className="h-px w-12 bg-amber-800/30 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Select the perfect tier for your private viewing experience
            </p>
          </div>

          <ExperienceTierSelector
            tiers={cinemaTiers}
            selectedTier={selectedTier}
            onSelectTier={handleTierSelect}
            defaultTier="premium"
          />

          <div className="text-center mt-16 opacity-0 animate-fade-in stagger-4">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="group inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-light text-lg transition-all duration-300 border-b border-transparent hover:border-gray-900 pb-1"
            >
              <span>Contact us for custom bespoke experiences</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {selectedTier && selectedTierDetails && (
        <section id="booking-form" className="py-32 bg-gradient-to-b from-stone-50 to-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-visible opacity-0 animate-scale-in">
              <div className="relative h-2 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
                <div className="absolute inset-0 shimmer"></div>
              </div>
              
              <div className="p-10 md:p-12">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-6 transition-transform duration-500 hover:scale-110">
                    <Clock className="h-8 w-8 text-blue-900" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-4xl font-light tracking-tight text-gray-900 mb-3">
                    Reserve Your Screening
                  </h2>
                  <div className="inline-block px-6 py-2 bg-blue-50 rounded-full mb-4">
                    <p className="text-sm font-medium tracking-wide text-blue-900">
                      {selectedTierDetails.name}
                    </p>
                  </div>
                  <p className="text-3xl font-serif font-light text-gray-900 mb-2">
                    £{selectedTierDetails.price}
                  </p>
                  <p className="text-base text-gray-500 font-light">
                    {selectedTierDetails.description}
                  </p>
                </div>


              {submitStatus === 'error' && (
                <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl animate-scale-in">
                  <p className="text-red-800 text-center font-light leading-relaxed">
                    {errorMessage || 'Something went wrong. Please try again.'}
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

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />

                <DatePicker
                  label="Preferred Date"
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date, timeSlot: '' })}
                  minDate={minDate}
                  fullyBookedDates={fullyBookedDates}
                  required
                />

                {formData.date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Time Slot <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlots.has(slot);
                        const isSelected = formData.timeSlot === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => !isBooked && setFormData({ ...formData, timeSlot: slot })}
                            disabled={isBooked}
                            className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                              isBooked
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-900 hover:text-blue-900'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {bookedSlots.size > 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        Grayed out slots are unavailable
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.timeSlot}
                    className={`w-full py-5 rounded-xl font-light text-base tracking-wide transition-all duration-300 ${
                      loading || !formData.timeSlot
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-900 text-white hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      'Confirm Reservation'
                    )}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </section>
      )}

      <StripeCheckout
        isOpen={showStripeCheckout}
        onClose={() => {
          setShowStripeCheckout(false);
          setPendingBookingId(null);
        }}
        amount={selectedTierDetails?.price || 0}
        serviceType="cinema"
        bookingId={pendingBookingId || undefined}
        customerName={formData.fullName}
        customerEmail={formData.email}
        onSuccess={async () => {
          setShowStripeCheckout(false);
          
          // Send confirmation email
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (supabaseUrl && !supabaseUrl.includes('placeholder') && pendingBookingId) {
            try {
              const emailApiUrl = `${supabaseUrl}/functions/v1/send-booking-confirmation`;
              await fetch(emailApiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  serviceType: 'cinema',
                  bookingId: pendingBookingId,
                  fullName: formData.fullName,
                  email: formData.email,
                  phone: formData.phone,
                  bookingDate: formData.date,
                  timeSlot: formData.timeSlot,
                  packageType: tierToPackageName[selectedTier!],
                  packagePrice: selectedTierDetails?.price,
                  experienceTier: selectedTier,
                }),
              });
            } catch (emailError: any) {
              console.warn('Email sending failed:', emailError.message);
            }
          }

          setSubmitStatus('success');
          setErrorMessage('');
          
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            date: '',
            timeSlot: '',
          });
          
          if (formData.date) {
            fetchUnavailableSlots(formData.date);
          }
          
          setPendingBookingId(null);
        }}
      />

      <SuccessModal
        isOpen={submitStatus === 'success'}
        onClose={() => {
          setSubmitStatus('idle');
          setSelectedTier('premium');
        }}
        title="Payment Confirmed"
        message="Your cinema reservation has been successfully booked"
        details="Payment successful! A confirmation email has been sent to your email address. Please check your inbox (and spam folder) for booking details."
        footerMessage="We look forward to welcoming you for your cinema experience"
      />

      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Bespoke Experiences"
      >
        <div className="space-y-6">
          <p className="text-gray-600 font-light leading-relaxed">
            For tailored cinema experiences crafted exclusively for you, our concierge team is at your service.
          </p>
          <div className="space-y-5 bg-gradient-to-br from-stone-50 to-amber-50/30 p-8 rounded-2xl border border-stone-200">
            <div className="group">
              <p className="text-xs font-medium tracking-wider text-gray-500 uppercase mb-2">Email</p>
              <a 
                href="mailto:info@nhtestates.co.uk" 
                className="text-lg text-gray-900 hover:text-amber-700 font-light transition-colors duration-300 flex items-center gap-2"
              >
                info@nhtestates.co.uk
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
                className="text-lg text-gray-900 hover:text-amber-700 font-light transition-colors duration-300 flex items-center gap-2"
              >
                +44 1234 567890
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
