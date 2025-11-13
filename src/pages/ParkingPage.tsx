import { useState, FormEvent } from 'react';
import { Car } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';

const properties = [
  'Coastal Serenity Villa',
  'Modern Harbourside Retreat',
  'Elegant Country Manor',
  'Waterfront Penthouse',
  'Beachfront Paradise',
  'Contemporary Lighthouse Lodge',
  'Other',
];

export default function ParkingPage() {
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    vehicleMake: '',
    registration: '',
    propertyName: '',
    additionalDetails: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setSubmitStatus('idle');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-parking-permit-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send request');
      }

      setSubmitStatus('success');
      setFormData({
        fullName: '',
        email: '',
        vehicleMake: '',
        registration: '',
        propertyName: '',
        additionalDetails: '',
      });
    } catch (error) {
      console.error('Error submitting permit request:', error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 text-center px-4">
          <Car className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-serif text-white mb-4">
            Parking Permit Request
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Secure your parking arrangements with ease
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-serif text-gray-900 mb-4">
              About Parking Permits
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We provide convenient parking solutions for all our guests. To ensure your
                vehicle is properly registered and authorized, please complete the form below.
              </p>
              <p>
                Once submitted, our team will review your request and send you a confirmation
                email with your parking permit details within 24 hours.
              </p>
              <p className="font-medium text-gray-900">
                Please note: All vehicles must be registered before arrival to ensure smooth
                check-in.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-serif text-gray-900 mb-8 text-center">
              Request Your Permit
            </h2>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-center font-medium">
                  Your parking permit request has been sent successfully! We'll email you within
                  24 hours with your permit details.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-center font-medium">
                  Failed to send your request. Please try again or contact us directly.
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:outline-none bg-white transition-all duration-200"
                >
                  <option value="">Select your property</option>
                  {properties.map((property) => (
                    <option key={property} value={property}>
                      {property}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  value={formData.additionalDetails}
                  onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                  rows={4}
                  placeholder="Any special requirements or additional information..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:outline-none bg-white transition-all duration-200 resize-none"
                />
              </div>

              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Submit Request'}
              </Button>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Need immediate assistance?</p>
            <div className="space-y-2">
              <p className="text-gray-900">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:parking@nhtestates.com"
                  className="text-blue-900 hover:underline"
                >
                  parking@nhtestates.com
                </a>
              </p>
              <p className="text-gray-900">
                <strong>Phone:</strong>{' '}
                <a href="tel:+441234567890" className="text-blue-900 hover:underline">
                  +44 1234 567890
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
