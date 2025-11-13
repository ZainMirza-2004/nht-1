import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Home, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

interface Property {
  id: string;
  title: string;
  description: string;
  image_url: string;
  airbnb_url: string;
  location: string;
  price_per_night: number;
  bedrooms: number;
}

const testimonials = [
  {
    name: 'Sarah Mitchell',
    location: 'London',
    text: 'Absolutely exceptional service. The property was immaculate and the spa facilities were world-class. NH&T Estates truly understand luxury hospitality.',
    rating: 5,
  },
  {
    name: 'James Thornton',
    location: 'Manchester',
    text: 'From booking to checkout, everything was seamless. The private cinema was a highlight of our stay. Highly recommended for families.',
    rating: 5,
  },
  {
    name: 'Emma Richardson',
    location: 'Edinburgh',
    text: 'The attention to detail is remarkable. Every amenity you could possibly need, managed to perfection. We will definitely be returning.',
    rating: 5,
  },
];

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1118877/pexels-photo-1118877.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">
            Luxury Redefined
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto">
            Experience unparalleled comfort in our curated collection of coastal retreats
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Properties
              <ChevronRight className="inline ml-2 h-5 w-5" />
            </Button>
            <Link to="/spa">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-blue-900">
                Book Spa Experience
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900 rounded-full mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <Home className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-serif text-gray-900 mb-3">Premium Properties</h3>
              <p className="text-gray-600 leading-relaxed">
                Hand-selected luxury homes in the most desirable coastal locations
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900 rounded-full mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-serif text-gray-900 mb-3">Exclusive Amenities</h3>
              <p className="text-gray-600 leading-relaxed">
                World-class spa facilities and private cinema for an unforgettable stay
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900 rounded-full mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-serif text-gray-900 mb-3">Exceptional Service</h3>
              <p className="text-gray-600 leading-relaxed">
                Dedicated concierge team ensuring every detail exceeds expectations
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="properties" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our carefully curated selection of luxury coastal homes
            </p>
          </div>

          {loading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <a
                  key={property.id}
                  href={property.airbnb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg">
                      <span className="text-blue-900 font-semibold">£{property.price_per_night}/night</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-serif text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{property.location}</p>
                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2">
                      {property.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{property.bedrooms} Bedrooms</span>
                      <ChevronRight className="h-5 w-5 text-blue-900 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
              Guest Testimonials
            </h2>
            <p className="text-xl text-gray-600">
              What our guests say about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif mb-6">Ready to Experience Luxury?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Book your perfect coastal escape today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/spa">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                Book Spa Treatment
              </Button>
            </Link>
            <Link to="/cinema">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                Reserve Cinema
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
