import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
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

interface Testimonial {
  name: string;
  location?: string;
  text: string;
  rating: number;
  date?: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Emma',
    text: "Had a great stay, hosts couldn't do enough, very friendly and helpful. The location was good, short walk into the centre. Thanks for having us xx",
    rating: 5,
  },
  {
    name: 'Laura',
    text: 'Enjoyed our stay, would use again. Newly refurbished, clean and tidy. Easy walk to city centre and Principality Stadium.',
    rating: 5,
    date: 'July 2025',
  },
  {
    name: 'Eloise',
    location: 'Bognor Regis, UK',
    text: 'Really cute location, perfect if going to the stadium.',
    rating: 5,
    date: '5 days ago',
  },
  {
    name: 'Jennifer',
    location: 'Bristol, UK',
    text: 'We had an amazing time here! The place was spotless and incredibly comfortable. Check-in procedure was easy, and the host was super responsive throughout the stay. The location was ideal too – quiet, safe, and walkable to everything we needed. I would 100% stay here again and highly recommend it to anyone.',
    rating: 5,
    date: '2 weeks ago',
  },
  {
    name: 'Kady',
    text: 'We recently stayed in cinema room 1 and it was absolutely fantastic! The room was beautifully designed, the screen quality was incredible, and the whole experience felt very premium. The hosts were wonderful and made sure we had everything we needed. Would definitely book again!',
    rating: 5,
    date: 'October 2025',
  },
  {
    name: 'Spencer',
    location: 'England, UK',
    text: 'Stayed in one of the cinema rooms with added access to the sauna and hot tub. What an amazing experience! The facilities were top-notch, everything was clean and well-maintained. The location is perfect for exploring Cardiff. Highly recommend!',
    rating: 5,
    date: 'Sept 2025',
  },
  {
    name: 'Sarah',
    text: 'A lovely tidy apartment, just like the photos! The place was spotless when we arrived and had everything we needed. Great location, easy check-in, and the hosts were very helpful. Would definitely stay here again.',
    rating: 4,
    date: 'Sept 2025',
  },
  {
    name: 'Eleanor',
    location: 'Cwmbran, UK',
    text: 'Beautiful place and very close to the city centre. The apartment was modern, clean, and had all the amenities we needed. The hosts were responsive and helpful. Perfect for our weekend getaway!',
    rating: 5,
  },
  {
    name: 'Ashley',
    location: 'Bristol, UK',
    text: 'Great value stay. The apartment was clean, comfortable, and in a perfect location. Easy walk to everything in Cardiff. The hosts were very accommodating. Would recommend!',
    rating: 4,
    date: 'Sept 2025',
  },
  {
    name: 'Georgina',
    location: 'London, UK',
    text: 'Great hosts – super responsive and helpful throughout our stay. The place was exactly as described, clean and well-equipped. Location is perfect for exploring Cardiff. Had a wonderful time!',
    rating: 5,
    date: 'Aug 2025',
  },
  {
    name: 'Manisha',
    location: 'Birmingham, UK',
    text: "Thank you for helping make my partner's birthday special. The cinema room was perfect for a romantic evening, and the hosts went above and beyond to make our stay memorable. Highly recommend!",
    rating: 5,
    date: 'Aug 2025',
  },
  {
    name: 'Morgan',
    text: 'Room was well described and exactly as shown in the photos. Clean, comfortable, and in a great location. The hosts were very friendly and quick to respond to any questions. Great stay overall!',
    rating: 5,
    date: 'Aug 2025',
  },
  {
    name: 'Tilly',
    text: 'The stay here was great for me and my friends. The apartment was spacious, clean, and had everything we needed. The location was perfect – close to the city centre and all the nightlife. Would definitely book again!',
    rating: 5,
    date: 'Aug 2025',
  },
  {
    name: 'Faith',
    location: 'Northampton, UK',
    text: 'Lovely stay, will recommend to friends and family. The place was clean, comfortable, and the hosts were very accommodating. Great location for exploring Cardiff. Thank you!',
    rating: 4,
    date: 'Aug 2025',
  },
  {
    name: 'Keanu',
    text: 'Very easy information and helped with queries quickly. The apartment was clean and well-maintained. Great location, easy check-in process. Had a pleasant stay!',
    rating: 5,
    date: 'Aug 2025',
  },
  {
    name: 'Chloe',
    location: 'Cardiff, UK',
    text: 'Had a great overnight stay for 5 of us. The apartment was spacious enough for everyone, clean, and had all the amenities we needed. The hosts were very helpful. Would stay again!',
    rating: 5,
    date: 'Aug 2025',
  },
  {
    name: 'Lauren',
    text: 'Stayed for one night with friends and had a wonderful time. The place was clean, comfortable, and in a perfect location. The hosts were responsive and helpful. Great value for money!',
    rating: 5,
    date: 'July 2025',
  },
  {
    name: 'Haylie',
    location: 'Wales, UK',
    text: 'Ideally located. Comfortable, clean, and well-equipped apartment. The hosts were very friendly and made sure we had everything we needed. Perfect for our weekend in Cardiff!',
    rating: 5,
    date: 'July 2025',
  },
  {
    name: 'Loonylous',
    location: 'Exeter, UK',
    text: 'Had a lovely stay, hosts were amazing and very accommodating. The apartment was spotless and had everything we needed. Great location, easy check-in. Would definitely recommend!',
    rating: 5,
    date: 'July 2025',
  },
  {
    name: 'Siu Yuen',
    location: 'Hong Kong',
    text: 'Extremely satisfied overall. The apartment was clean, modern, and well-located. The hosts were very responsive and helpful. Great experience from booking to checkout. Highly recommend!',
    rating: 5,
    date: 'June 2025',
  },
  {
    name: 'Manish',
    location: 'Leicester, UK',
    text: 'It was a nice clean place with all the essentials. The location was perfect for exploring Cardiff, and the hosts were very helpful. Good value for money. Would stay again!',
    rating: 5,
    date: 'June 2025',
  },
  {
    name: 'Anisa',
    text: 'Had a lovely stay, everything as expected. The apartment was clean, comfortable, and well-equipped. The hosts were friendly and responsive. Great location too. Thank you!',
    rating: 5,
    date: 'June 2025',
  },
  {
    name: 'Haylie',
    location: 'Wales, UK',
    text: 'Comfortable clean and nicely decorated apartment. The hosts were very helpful and the location was perfect. Had a great stay and would definitely book again!',
    rating: 5,
    date: 'July 2025',
  },
];

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  useEffect(() => {
    fetchProperties();
  }, []);

  // Duplicate testimonials for infinite loop
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // Update the first property with the new details
      const properties: Property[] = (data || []) as Property[];
      if (properties.length > 0) {
        properties[0] = {
          ...properties[0],
          title: 'Luxury Victorian Flat',
          description: 'Stay in luxury at this stunning Victorian 2-bedroom flat in the heart of Cardiff city centre, right next to the Principality Stadium and Cardiff Central Station. This elegant listed building blends classic charm with modern comfort. Sleeps up to 8 guests with stylish décor, city views, and on-site parking—all just steps from Cardiff\'s best shopping, dining, and nightlife.',
          image_url: '/2bed.jpg',
          location: 'Cardiff UK',
          price_per_night: 190,
          bedrooms: 2,
          airbnb_url: 'https://www.airbnb.co.uk/rooms/1553108401152199815?source_impression_id=p3_1763320422_P3Yt8Uqgn7jPHmt7',
        };
      }
      
      // Update the second property with the new details
      if (properties.length > 1) {
        properties[1] = {
          ...properties[1],
          title: 'Luxury Penylan Apartment',
          description: 'Stay in a stylish 2-bed flat featuring a royal-blue bedroom and a golden-accented room, each designed with luxe materials and suede touches. Just 2 mins from Cardiff city centre, enjoy a modern kitchen/living space, fast WiFi and comfy beds. Upgrade your stay with our bookable jacuzzi and on-site cinema. Perfect for couples, groups and families.',
          image_url: '/2bedPenylan.jpg',
          location: 'Penylan, Cardiff UK',
          price_per_night: 190,
          bedrooms: 2,
          airbnb_url: 'https://www.airbnb.co.uk/rooms/1553825454268345614?source_impression_id=p3_1763321949_P3xJr5TjO_gYb28f',
        };
      }
      
      // Update the third property with the new details
      if (properties.length > 2) {
        properties[2] = {
          ...properties[2],
          title: 'Modern Penylan Flat',
          description: 'Stay in a modern 1-bed flat in central Cardiff, just a 2-min walk to the city centre, top restaurants, shops and nightlife. Perfect for couples, families and groups, with a comfy double bed and suede sofa bed. Enjoy free parking, fast WiFi and a brand-new kitchen/living space. Bookable spa access available as a paid amenity.',
          image_url: '/1bedpenylan.jpeg',
          location: 'Penylan, Cardiff UK',
          price_per_night: 140,
          bedrooms: 1,
          airbnb_url: 'https://www.airbnb.co.uk/rooms/1553275092504034566?source_impression_id=p3_1763321949_P3jk08WKMpPMNfyW',
        };
      }
      
      // Update the fourth property with the new details
      if (properties.length > 3) {
        properties[3] = {
          ...properties[3],
          title: 'Emerald Luxury Penylan Flat',
          description: 'Immerse yourself in an emerald-themed, gold-accented 1-bed flat styled with suede leather and luxe finishes. Just 2 mins from Cardiff city centre, enjoy a comfy double bed, sofa bed, fast WiFi and a modern kitchen/living space. Enhance your stay with our bookable spa and onsite cinema experience. Perfect for couples, solo travellers or 3 friends.',
          image_url: '/1bedPenylann.jpg',
          location: 'Penylan, Cardiff UK',
          price_per_night: 140,
          bedrooms: 1,
          airbnb_url: 'https://www.airbnb.co.uk/rooms/1553799390114160128?source_impression_id=p3_1763323934_P3Zg3z3ob8TyeHEW',
        };
      }
      
      // Update the fifth property with the new details
      if (properties.length > 4) {
        properties[4] = {
          ...properties[4],
          title: 'Private Cinema Studio',
          description: 'Make your stay a full date-night experience. Check in at 6pm after exploring Cardiff and enjoying dinner, then unwind in your private cinema studio with a 100" screen and cosy sofa bed. Book a jacuzzi or spa session and receive your own key to the facility for maximum privacy. The studio includes a kitchenette with kettle, microwave, toaster and complimentary tea, coffee and sugar—perfect for a romantic, unforgettable escape.',
          image_url: '/Cinemaroomrental.jpg',
          location: 'Penylan Cardiff UK',
          price_per_night: 140,
          bedrooms: 1,
          airbnb_url: 'https://www.airbnb.co.uk/rooms/1554094278292979136?source_impression_id=p3_1763323934_P38O2MpabNTtjYtu',
        };
      }
      
      // Update the sixth property with the new details
      if (properties.length > 5) {
        properties[5] = {
          ...properties[5],
          title: 'Stylish Cardiff Centre Apartment',
          description: 'Relax in this stylish and modern 2-bedroom flat in the heart of Cardiff, just a 2-minute walk from the city centre, restaurants, cafés and nightlife. Features two spacious double bedrooms, a comfortable suede leather sofa bed, and a brand-new hybrid kitchen/living space perfect for cooking, dining and socialising. Ideal for couples, friends, families and groups. Book access to our on-site spa for an added touch of luxury.',
          image_url: '/2bedrental.jpg',
          location: 'Cardiff Centre UK',
          price_per_night: 190,
          bedrooms: 2,
          airbnb_url: 'https://www.airbnb.co.uk/rooms/1553231471141991222?source_impression_id=p3_1763323934_P3tnsgJmCUsix9vE',
        };
      }
      
      // Update all remaining properties' locations to Penylan, Cardiff UK
      for (let i = 6; i < properties.length; i++) {
        properties[i] = {
          ...properties[i],
          location: 'Penylan, Cardiff UK',
        };
      }
      
      setProperties(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <style>{`
        .embla {
          overflow: hidden;
        }
        .embla__container {
          display: flex;
        }
        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
        }
        @media (min-width: 768px) {
          .embla__slide {
            flex: 0 0 calc(50% - 1rem);
          }
        }
        @media (min-width: 1024px) {
          .embla__slide {
            flex: 0 0 calc(33.333% - 1.33rem);
          }
        }
      `}</style>
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/homepage2.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.3)' }}>
            Luxury Redefined
          </h1>
          <p className="text-xl md:text-2xl text-white mb-12 leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)' }}>
            Experience unparalleled comfort in our curated collection of coastal retreats
          </p>
          <div className="flex flex-col sm:flex-row justify-center
                gap-4 sm:gap-0           /* vertical gap on mobile, remove it on row */
                space-y-2 sm:space-y-0  /* vertical spacing for column on mobile */
                sm:space-x-3">          {/* horizontal spacing on desktop */}

  <Button
    size="lg"
    className="w-full max-w-[280px] mx-auto sm:mx-0 sm:w-auto sm:max-w-none"
    onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
  >
    Explore Properties
    <ChevronRight className="inline ml-2 h-5 w-5" />
  </Button>

  <Link to="/spa" className="w-full max-w-[280px] mx-auto sm:mx-0 sm:w-auto sm:max-w-none">
    <Button
      size="lg"
      variant="outline"
      className="w-full bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:!text-black"
    >
      Book Spa Experience
    </Button>
  </Link>
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
                  href="https://nhtestates.bookeddirectly.com/g"
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
                      <span className="text-blue-900 font-serif font-semibold">£{property.price_per_night}/night</span>
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

      <section className="py-24 bg-gray-50" aria-live="polite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
              Guest Testimonials
            </h2>
            <p className="text-xl text-gray-600">
              What our guests say about their experience
            </p>
          </div>

          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-6">
              {duplicatedTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="embla__slide flex-shrink-0"
                >
                  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6 italic flex-grow">
                      "{testimonial.text}"
                    </p>
                    <div className="mt-auto">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      {testimonial.location && (
                        <p className="text-sm text-gray-600">{testimonial.location}</p>
                      )}
                      {testimonial.date && (
                        <p className="text-sm text-gray-500 mt-1">{testimonial.date}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                Book Spa Treatment
              </Button>
            </Link>
            <Link to="/cinema">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                Reserve Cinema
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
