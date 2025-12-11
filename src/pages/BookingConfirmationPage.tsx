import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

interface BookingData {
  id: string;
  serviceType: 'spa' | 'cinema' | 'parking';
  fullName: string;
  email: string;
  phone?: string;
  bookingDate: string;
  timeSlot?: string;
  packageType?: string;
  packagePrice?: number;
  experienceTier?: string;
  permitId?: string;
  propertyName?: string;
  vehicleMake?: string;
  registration?: string;
  numberOfNights?: number;
}

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        const permitId = searchParams.get('permitId');
        const serviceType = searchParams.get('serviceType') as 'spa' | 'cinema' | 'parking';

        if ((!bookingId && !permitId) || !serviceType) {
          setError('Invalid booking confirmation link');
          setLoading(false);
          return;
        }

        // Fetch booking from database with proper typing
        type SpaBooking = Database['public']['Tables']['spa_bookings']['Row'];
        type CinemaBooking = Database['public']['Tables']['cinema_bookings']['Row'];
        type ParkingPermit = {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          permit_date?: string | null;
          permit_id?: string | null;
          property_name?: string | null;
          vehicle_make?: string | null;
          registration?: string | null;
          number_of_nights?: number | null;
          email_sent?: boolean | null;
          [key: string]: any; // Allow other fields
        };
        
        let data: SpaBooking | CinemaBooking | ParkingPermit | null = null;
        let fetchError: any = null;

        if (serviceType === 'spa') {
          if (!bookingId) {
            setError('Missing booking identifier');
            setLoading(false);
            return;
          }
          const result = await supabase
            .from('spa_bookings')
            .select('*')
            .eq('id', bookingId)
            .single();
          data = result.data as SpaBooking | null;
          fetchError = result.error;
        } else if (serviceType === 'cinema') {
          if (!bookingId) {
            setError('Missing booking identifier');
            setLoading(false);
            return;
          }
          const result = await supabase
            .from('cinema_bookings')
            .select('*')
            .eq('id', bookingId)
            .single();
          data = result.data as CinemaBooking | null;
          fetchError = result.error;
        } else if (serviceType === 'parking') {
          if (permitId) {
            const result = await supabase
              .from('parking_permit_requests')
              .select('*')
              .eq('permit_id', permitId)
              .single();
            data = result.data as ParkingPermit | null;
            fetchError = result.error;
          } else if (bookingId) {
            const result = await supabase
              .from('parking_permit_requests')
              .select('*')
              .eq('id', bookingId)
              .single();
            data = result.data as ParkingPermit | null;
            fetchError = result.error;
          } else {
            setError('Missing booking identifier');
            setLoading(false);
            return;
          }
        }

        if (fetchError || !data) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        // Type guard: data is now guaranteed to be non-null
        const bookingData = data as SpaBooking | CinemaBooking | ParkingPermit;

        // Format booking data with proper type handling
        const formattedData: BookingData = {
          id: bookingData.id,
          serviceType: serviceType,
          fullName: bookingData.full_name,
          email: bookingData.email,
          phone: bookingData.phone || undefined,
          bookingDate: serviceType === 'parking' 
            ? (bookingData as ParkingPermit).permit_date || '' 
            : (bookingData as SpaBooking | CinemaBooking).booking_date || '',
          timeSlot: serviceType === 'parking' 
            ? undefined 
            : (bookingData as SpaBooking | CinemaBooking).time_slot || undefined,
          packageType: serviceType === 'parking' 
            ? undefined 
            : (bookingData as SpaBooking | CinemaBooking).package_type || undefined,
          packagePrice: serviceType === 'parking' 
            ? undefined 
            : (bookingData as SpaBooking | CinemaBooking).package_price || undefined,
          experienceTier: serviceType === 'parking' 
            ? undefined 
            : (bookingData as SpaBooking | CinemaBooking).experience_tier || undefined,
          permitId: serviceType === 'parking' 
            ? (bookingData as ParkingPermit).permit_id || undefined 
            : undefined,
          propertyName: serviceType === 'parking' 
            ? (bookingData as ParkingPermit).property_name || undefined 
            : undefined,
          vehicleMake: serviceType === 'parking' 
            ? (bookingData as ParkingPermit).vehicle_make || undefined 
            : undefined,
          registration: serviceType === 'parking' 
            ? (bookingData as ParkingPermit).registration || undefined 
            : undefined,
          numberOfNights: serviceType === 'parking' 
            ? (bookingData as ParkingPermit).number_of_nights || undefined 
            : undefined,
        };

        setBookingData(formattedData);

        // Send confirmation email if this is a spa/cinema booking
        // Since we're on the confirmation page, payment was successful
        // Send email regardless of status (webhook might not have updated it yet)
        if (serviceType === 'spa' || serviceType === 'cinema') {
          // Check if email was already sent (check email_sent flag if it exists)
          // Note: email_sent flag is not currently in spa/cinema booking tables
          const emailAlreadySent = false;
          
          if (!emailAlreadySent) {
            // Send confirmation email in background (don't block page load)
            sendConfirmationEmail(formattedData, serviceType).catch(err => {
              console.warn('Failed to send confirmation email:', err);
              // Don't show error to user - email sending is non-critical
            });
          } else {
            console.log('📧 Email already sent for this booking');
          }
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [searchParams]);

  // Function to send confirmation email
  const sendConfirmationEmail = async (booking: BookingData, serviceType: 'spa' | 'cinema') => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn('Supabase URL not configured, cannot send email');
        return;
      }

      // Map tier names for email function
      const tierToPackageName: Record<string, string> = {
        standard: serviceType === 'spa' ? '1 Hour Session' : 'Standard Experience',
        premium: serviceType === 'spa' ? '1.5 Hour Session' : 'Premium Experience',
        deluxe: serviceType === 'spa' ? '2 Hour Premium Session' : 'Deluxe Experience',
      };

      const packageType = booking.experienceTier 
        ? tierToPackageName[booking.experienceTier] || booking.packageType || ''
        : booking.packageType || '';

      const emailPayload = {
        serviceType: serviceType,
        bookingId: booking.id,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone || '',
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot || '',
        packageType: packageType,
        packagePrice: booking.packagePrice || 0,
        experienceTier: booking.experienceTier,
      };

      console.log('📧 Sending confirmation email from confirmation page...');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Email function returned error:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('✅ Confirmation email sent successfully:', result);
    } catch (error: any) {
      console.error('❌ Error sending confirmation email:', error);
      throw error;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getServiceName = (serviceType: string): string => {
    switch (serviceType) {
      case 'spa':
        return 'Spa & Wellness';
      case 'cinema':
        return 'Private Cinema';
      case 'parking':
        return 'Parking Permit';
      default:
        return 'Booking';
    }
  };

  const getTierDisplayName = (tier?: string): string => {
    if (!tier) return '';
    const tierNames: Record<string, string> = {
      standard: 'Standard Experience',
      premium: 'Premium Experience',
      deluxe: 'Deluxe Experience',
    };
    return tierNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1) + ' Experience';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-stone-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
          <p className="text-gray-600 font-light">Loading your booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-stone-50 via-white to-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 font-light mb-6">{error || 'Unable to load booking details'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-900 text-white rounded-xl font-light hover:bg-blue-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-light tracking-tight text-gray-900 mb-4">
            Booking Confirmed
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Your {getServiceName(bookingData.serviceType)} reservation is confirmed
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-8 py-6">
            <h2 className="text-2xl font-light text-white">Booking Details</h2>
          </div>

          <div className="p-8 space-y-6">
            {/* Service Type */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-900" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">Service</p>
                <p className="text-lg text-gray-900 font-light">{getServiceName(bookingData.serviceType)}</p>
                {bookingData.experienceTier && (
                  <p className="text-sm text-gray-600 font-light mt-1">{getTierDisplayName(bookingData.experienceTier)}</p>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-900" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">Date</p>
                <p className="text-lg text-gray-900 font-light">{formatDate(bookingData.bookingDate)}</p>
              </div>
            </div>

            {/* Time Slot (if applicable) */}
            {bookingData.timeSlot && (
              <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-900" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-1">Time</p>
                  <p className="text-lg text-gray-900 font-light">{bookingData.timeSlot}</p>
                </div>
              </div>
            )}

            {/* Parking Permit Details */}
            {bookingData.serviceType === 'parking' && (
              <>
                {bookingData.permitId && (
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Permit ID</p>
                      <p className="text-lg text-gray-900 font-light font-mono">{bookingData.permitId}</p>
                    </div>
                  </div>
                )}
                {bookingData.propertyName && (
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Property</p>
                      <p className="text-lg text-gray-900 font-light">{bookingData.propertyName}</p>
                    </div>
                  </div>
                )}
                {bookingData.vehicleMake && (
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Vehicle</p>
                      <p className="text-lg text-gray-900 font-light">{bookingData.vehicleMake}</p>
                      {bookingData.registration && (
                        <p className="text-sm text-gray-600 font-light mt-1">Registration: {bookingData.registration}</p>
                      )}
                    </div>
                  </div>
                )}
                {bookingData.numberOfNights && bookingData.numberOfNights > 1 && (
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Duration</p>
                      <p className="text-lg text-gray-900 font-light">{bookingData.numberOfNights} {bookingData.numberOfNights === 1 ? 'night' : 'nights'}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Price */}
            {bookingData.packagePrice && (
              <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg text-blue-900 font-light">£</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-1">Amount Paid</p>
                  <p className="text-2xl text-gray-900 font-light">£{bookingData.packagePrice.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Booking ID */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-600 font-mono">ID</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">Booking Reference</p>
                <p className="text-sm text-gray-600 font-light font-mono break-all">{bookingData.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-100">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-blue-900 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-light text-gray-900 mb-2">Confirmation Email Sent</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                A confirmation email with all booking details has been sent to <strong>{bookingData.email}</strong>. 
                Please check your inbox (and spam folder) for the email.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h3 className="text-xl font-light text-gray-900 mb-6 text-center">Need Assistance?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="mailto:info@nhtestates.com"
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Mail className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Email</p>
                <p className="text-gray-900 font-light">info@nhtestates.com</p>
              </div>
            </a>
            <a
              href="tel:+441234567890"
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Phone className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Phone</p>
                <p className="text-gray-900 font-light">+44 1234 567890</p>
              </div>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 px-6 rounded-xl bg-blue-900 text-white font-light hover:bg-blue-800 transition-colors text-center"
          >
            Return Home
          </button>
          {(bookingData.serviceType === 'spa' || bookingData.serviceType === 'cinema') && (
            <button
              onClick={() => navigate(`/${bookingData.serviceType}`)}
              className="flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-light hover:bg-gray-50 transition-colors text-center"
            >
              Book Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

