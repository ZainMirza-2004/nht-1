import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  details?: string;
  footerMessage?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title = 'Confirmed',
  message = 'Your booking has been reserved',
  details,
  footerMessage = 'We look forward to welcoming you',
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        style={{
          animation: isOpen ? 'fadeIn 0.3s ease-out' : 'none',
        }}
      />
      
      {/* Modal */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300"
        style={{
          animation: isOpen ? 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes checkMarkDraw {
            0% {
              stroke-dashoffset: 100;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          .check-animated {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
            animation: checkMarkDraw 0.6s ease-out 0.2s forwards;
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>

        <div className="p-10 md:p-12">
          <div className="text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-8 shadow-lg shadow-emerald-200/50 mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                <Check className="w-12 h-12 text-white relative z-10" strokeWidth={3} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-3xl font-light tracking-tight text-gray-900 mb-3">
              {title}
            </h3>

            {/* Message */}
            <p className="text-emerald-800 text-lg font-light mb-6 leading-relaxed">
              {message}
            </p>

            {/* Details */}
            {details && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm mb-6">
                <p className="text-sm text-gray-700 font-light leading-relaxed">
                  {details}
                </p>
              </div>
            )}

            {/* Footer Message */}
            <p className="text-sm text-emerald-700 font-light mb-8">
              {footerMessage}
            </p>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-4 px-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-light text-base tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-gray-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

