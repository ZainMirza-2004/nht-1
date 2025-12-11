import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="NH&T Estates" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-serif text-white">NH&T Estates</span>
            </div>
            <p className="text-sm leading-relaxed">
              Exceptional luxury property management and premium amenities for discerning guests.
            </p>
          </div>

          <div>
            <h3 className="text-white font-medium mb-4 tracking-wide">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/spa" className="text-sm hover:text-blue-400 transition-colors">
                  Spa Services
                </Link>
              </li>
              <li>
                <Link to="/cinema" className="text-sm hover:text-blue-400 transition-colors">
                  Private Cinema
                </Link>
              </li>
              <li>
                <Link to="/parking" className="text-sm hover:text-blue-400 transition-colors">
                  Parking Permit
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-4 tracking-wide">Services</h3>
            <ul className="space-y-3 text-sm">
              <li>Luxury Property Management</li>
              <li>Concierge Services</li>
              <li>Spa & Wellness</li>
              <li>Private Cinema</li>
              <li>Property Maintenance</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-4 tracking-wide">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">123 Coastal Drive, Brighton, UK</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <a href="tel:+441234567890" className="text-sm hover:text-blue-400 transition-colors">
                  +44 7767 992108
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <a href="mailto:info@nhtestates.co.uk" className="text-sm hover:text-blue-400 transition-colors">
                  info@nhtestates.co.uk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} NH&T Estates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
