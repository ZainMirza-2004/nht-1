import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, Loader2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface StripeCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // in pounds
  serviceType: 'spa' | 'cinema' | 'parking';
  bookingId?: string;
  onSuccess: () => void;
  customerName?: string;
  customerEmail?: string;
}

// SECURITY FIX: Removed hardcoded Stripe key - must use environment variable
const getStripePublishableKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key.includes('placeholder')) {
    console.error('VITE_STRIPE_PUBLISHABLE_KEY is not configured. Please set it in your .env file.');
    return null;
  }
  return key;
};

const stripePromise = loadStripe(getStripePublishableKey() || '');

function CheckoutForm({
  amount,
  serviceType,
  bookingId,
  onSuccess,
  onClose,
  customerName,
  customerEmail,
}: Omit<StripeCheckoutProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setIsProcessing(false);
      return;
    }

    // Always use return_url - Stripe needs it for 3D Secure and other payment methods
    const returnUrl = new URL(`${window.location.origin}/payment-success`);
    if (bookingId) {
      returnUrl.searchParams.set('bookingId', bookingId);
    }
    if (serviceType) {
      returnUrl.searchParams.set('serviceType', serviceType);
    }

    const { error: paymentError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl.toString(),
        payment_method_data: {
          billing_details: {
            name: customerName,
            email: customerEmail,
          },
        },
      },
    });

    if (paymentError) {
      setError(paymentError.message || 'Payment failed');
      setIsProcessing(false);
    }
    // Note: If payment succeeds, Stripe will redirect to return_url
    // We don't call onSuccess here because Stripe handles the redirect
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 text-sm font-light">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-light transition-all duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 py-3 px-6 rounded-xl bg-blue-900 text-white hover:bg-blue-800 font-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay £${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}

export default function StripeCheckout({
  isOpen,
  onClose,
  amount,
  serviceType,
  bookingId,
  onSuccess,
  customerName,
  customerEmail,
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !clientSecret) {
      createPaymentIntent();
    }
  }, [isOpen]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase URL not configured');
      }

      // Convert amount from pounds to pence
      const amountInPence = Math.round(amount * 100);

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPence,
          currency: 'gbp',
          serviceType,
          bookingId,
          metadata: {
            customerName: customerName || '',
            customerEmail: customerEmail || '',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1e3a8a',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-gray-900">
              Complete Payment
            </h2>
            <p className="text-sm text-gray-500 font-light mt-1">
              {serviceType === 'spa' ? 'Spa Booking' : serviceType === 'cinema' ? 'Cinema Booking' : 'Parking Permit'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600 font-light">Preparing payment...</p>
            </div>
          ) : error ? (
            <div className="py-8">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <p className="text-red-800 text-sm font-light">{error}</p>
              </div>
              <button
                onClick={createPaymentIntent}
                className="w-full py-3 px-6 rounded-xl bg-blue-900 text-white hover:bg-blue-800 font-light transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                amount={amount}
                serviceType={serviceType}
                bookingId={bookingId}
                onSuccess={onSuccess}
                onClose={onClose}
                customerName={customerName}
                customerEmail={customerEmail}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
}

