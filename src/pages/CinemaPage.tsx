import { useState, useEffect, FormEvent } from 'react';
import { Film, Clock, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Package {
  id: string;
  name: string;
  duration: string;
  price: number;
  features: string[];
}

const packages: Package[] = [
  {
    id: 'standard',
    name: 'Standard Experience',
    duration: '2 hours',
    price: 75,
    features: [
      '4K Ultra HD projection',
      'Dolby Atmos surround sound',
      'Comfortable leather seating for up to 8',
      'Pre-movie refreshments',
      'Film selection from our library',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Experience',
    duration: '3 hours',
    price: 120,
    features: [
      '4K Ultra HD projection',
      'Dolby Atmos surround sound',
      'Luxury reclining seats for up to 8',
      'Gourmet popcorn bar',
      'Premium snacks & beverages',
      'Film selection from our library',
      'Extended viewing time',
    ],
  },
  {
    id: 'deluxe',
    name: 'Deluxe Experience',
    duration: '4 hours',
    price: 180,
    features: [
      '4K Ultra HD projection',
      'Dolby Atmos surround sound',
      'VIP reclining seats for up to 8',
      'Gourmet popcorn & candy bar',
      'Premium champagne & cocktails',
      'Chef-prepared appetizers',
      'Film selection from our library',
      'Double feature viewing',
      'Personal concierge service',
    ],
  },
];

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
];

export default function CinemaPage() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '',
  });

  useEffect(() => {
    if (formData.date) {
      fetchBookedSlots(formData.date);
    }
  }, [formData.date]);

  const fetchBookedSlots = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('cinema_bookings')
        .select('time_slot')
        .eq('booking_date', date)
        .returns<Array<{ time_slot: string }>>();

      if (error) throw error;

      const slots = new Set((data || []).map(booking => booking.time_slot));
      setBookedSlots(slots);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setTimeout(() => {
      document.getElementById('booking-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedPackage) return;

    setLoading(true);
    setSubmitStatus('idle');

    try {
      const bookingData: Database['public']['Tables']['cinema_bookings']['Insert'] = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        booking_date: formData.date,
        time_slot: formData.timeSlot,
        package_type: selectedPackage.name,
        package_price: selectedPackage.price,
      };

      const { error } = await (supabase as any).from('cinema_bookings').insert(bookingData);

      if (error) throw error;

      setSubmitStatus('success');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        date: '',
        timeSlot: '',
      });
      setSelectedPackage(null);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2000);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen pt-20">
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 text-center px-4">
          <Film className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-serif text-white mb-4">
            Private Cinema
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Experience cinema luxury in your own private theater
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-gray-900 mb-4">
              Cinema Packages
            </h2>
            <p className="text-xl text-gray-600">
              Select the perfect viewing experience for your group
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
                  selectedPackage?.id === pkg.id
                    ? 'border-blue-900 transform scale-105'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-serif text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                    <Clock className="h-5 w-5" />
                    <span>{pkg.duration}</span>
                  </div>
                  <div className="text-4xl font-bold text-blue-900">
                    £{pkg.price}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  onClick={() => handlePackageSelect(pkg)}
                  variant={selectedPackage?.id === pkg.id ? 'primary' : 'outline'}
                >
                  {selectedPackage?.id === pkg.id ? 'Selected' : 'Reserve'}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="text-blue-900 hover:text-blue-700 font-medium text-lg underline"
            >
              Planning a special event? Contact us for custom arrangements
            </button>
          </div>
        </div>
      </section>

      {selectedPackage && (
        <section id="booking-form" className="py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-serif text-gray-900 mb-2 text-center">
                Reserve Your Screening
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Selected: {selectedPackage.name} - £{selectedPackage.price}
              </p>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-center font-medium">
                    Booking confirmed! We'll send you a confirmation email shortly.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-center font-medium">
                    Something went wrong. Please try again.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <Input
                  label="Preferred Date"
                  type="date"
                  min={minDate}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, timeSlot: '' })}
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
                                ? 'bg-blue-900 text-white shadow-lg'
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

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={loading || !formData.timeSlot}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Confirm Booking'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Request Custom Experience"
      >
        <p className="text-gray-700 mb-6 leading-relaxed">
          For special events, longer bookings, or bespoke cinema experiences, please contact
          our events team:
        </p>
        <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-900">
            <strong>Email:</strong>{' '}
            <a href="mailto:cinema@nhtestates.com" className="text-blue-900 hover:underline">
              cinema@nhtestates.com
            </a>
          </p>
          <p className="text-gray-900">
            <strong>Phone:</strong>{' '}
            <a href="tel:+441234567890" className="text-blue-900 hover:underline">
              +44 1234 567890
            </a>
          </p>
        </div>
      </Modal>
    </div>
  );
}
