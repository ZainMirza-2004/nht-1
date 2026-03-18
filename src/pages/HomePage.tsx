import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Seo from "../components/Seo";
import AmenityCarousel from "../components/AmenityCarousel";

/* =======================
   Types
======================= */
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

/* =======================
   Testimonials
======================= */
const testimonials: Testimonial[] = [
  { name: "Emma", text: "Had a great stay, hosts couldn't do enough, very friendly and helpful. The location was good, short walk into the centre. Thanks for having us xx", rating: 5 },
  { name: "Laura", text: "Enjoyed our stay, would use again. Newly refurbished, clean and tidy. Easy walk to city centre and Principality Stadium.", rating: 5, date: "July 2025" },
  { name: "Eloise", location: "Bognor Regis, UK", text: "Really cute location, perfect if going to the stadium.", rating: 5, date: "5 days ago" },
  { name: "Jennifer", location: "Bristol, UK", text: "We had an amazing time here! The place was spotless and incredibly comfortable. Check-in procedure was easy, and the host was super responsive throughout the stay.", rating: 5, date: "2 weeks ago" },
  { name: "Kady", text: "We recently stayed in cinema room 1 and it was absolutely fantastic! The room was beautifully designed and the whole experience felt very premium.", rating: 5, date: "October 2025" },
  { name: "Spencer", location: "England, UK", text: "Stayed in one of the cinema rooms with added access to the sauna and hot tub. Amazing experience!", rating: 5, date: "Sept 2025" },
  { name: "Sarah", text: "A lovely tidy apartment, just like the photos! Great location and easy check-in.", rating: 4, date: "Sept 2025" },
  { name: "Eleanor", location: "Cwmbran, UK", text: "Beautiful place and very close to the city centre. Perfect for our weekend getaway!", rating: 5 },
  { name: "Ashley", location: "Bristol, UK", text: "Great value stay. Clean, comfortable, and in a perfect location.", rating: 4, date: "Sept 2025" },
  { name: "Georgina", location: "London, UK", text: "Great hosts – super responsive and helpful throughout our stay.", rating: 5, date: "Aug 2025" },
  { name: "Manisha", location: "Birmingham, UK", text: "Thank you for helping make my partner's birthday special. Highly recommend!", rating: 5, date: "Aug 2025" },
  { name: "Morgan", text: "Room was well described and exactly as shown in the photos.", rating: 5, date: "Aug 2025" },
  { name: "Tilly", text: "The stay here was great for me and my friends. Would definitely book again!", rating: 5, date: "Aug 2025" },
  { name: "Faith", location: "Northampton, UK", text: "Lovely stay, will recommend to friends and family.", rating: 4, date: "Aug 2025" },
  { name: "Keanu", text: "Very easy information and helped with queries quickly.", rating: 5, date: "Aug 2025" },
  { name: "Chloe", location: "Cardiff, UK", text: "Had a great overnight stay for 5 of us.", rating: 5, date: "Aug 2025" },
  { name: "Lauren", text: "Stayed for one night with friends and had a wonderful time.", rating: 5, date: "July 2025" },
  { name: "Haylie", location: "Wales, UK", text: "Ideally located. Comfortable, clean, and well-equipped apartment.", rating: 5, date: "July 2025" },
  { name: "Loonylous", location: "Exeter, UK", text: "Had a lovely stay, hosts were amazing and very accommodating.", rating: 5, date: "July 2025" },
  { name: "Siu Yuen", location: "Hong Kong", text: "Extremely satisfied overall. Highly recommend!", rating: 5, date: "June 2025" },
  { name: "Manish", location: "Leicester, UK", text: "Nice clean place with all the essentials.", rating: 5, date: "June 2025" },
  { name: "Anisa", text: "Had a lovely stay, everything as expected.", rating: 5, date: "June 2025" },
  { name: "Haylie", location: "Wales, UK", text: "Comfortable clean and nicely decorated apartment.", rating: 5, date: "July 2025" },
];

const marqueeItems = [...testimonials, ...testimonials];

const marqueeStyles = `
  @keyframes marquee-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee-scroll 60s linear infinite;
    will-change: transform;
  }
  .marquee-wrapper {
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
  }
`;

const FEATURED_PROPERTY_IMAGES = [
  "/2bed.webp",
  "/Property8.webp",
  "/Property12.webp",
  "/Property19.webp",
  "/Property15.webp",
  "/Property20.webp",
];

const SPA_CAROUSEL_IMAGES = [
  "/spa1.webp",
  "/spa2.webp",
  "/spa3.webp",
  "/spa4.webp",
];

const CINEMA_CAROUSEL_IMAGES = [
  "/cinema1.webp",
  "/cinema2.webp",
  "/cinema3.webp",
];

/** Homepage-only: when DB title matches (case-insensitive), show this copy instead. */
const HOME_FEATURED_BY_TITLE: Record<
  string,
  Pick<Property, "title" | "description" | "location">
> = {
  "coastal serenity villa": {
    title: "Luxury Victorian Apartment",
    location: "Cardiff, UK",
    description:
      "A beautiful Victorian apartment with period character, generous rooms, and elegant finishes—perfect for guests who want heritage charm with modern comfort.",
  },
  "modern harborside retreat": {
    title: "High-Rise Stay in London",
    location: "London, UK",
    description:
      "Sleek high-rise living in London with sweeping city views, contemporary interiors, and a premium base for work or leisure in the capital.",
  },
  "elegant country manor": {
    title: "Elegant Penthouse",
    location: "London, UK",
    description:
      "An elegant penthouse with spacious layout, refined design, and outstanding views—luxury sky-high living for a standout city stay.",
  },
  "beachfront paradise": {
    title: "Central London apartment",
    location: "Central London, UK",
    description:
      "Right in the heart of London with unbeatable access to dining, culture, and transport—a stylish, comfortable base to explore everything the city offers.",
  },
  "contemporary lighthouse lodge": {
    title: "Contemporary Apartment",
    location: "London, UK",
    description:
      "A bright contemporary apartment with clean lines, open living space, and modern comforts throughout—effortless style for short breaks or longer stays.",
  },
};

function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("featured_properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      const list = (data ?? []) as Property[];
      const withImages = list.map((p, i) => {
        const key = p.title.trim().toLowerCase();
        const overlay = HOME_FEATURED_BY_TITLE[key];
        return {
          ...p,
          image_url: FEATURED_PROPERTY_IMAGES[i] ?? p.image_url,
          ...(overlay
            ? {
                title: overlay.title,
                description: overlay.description,
                location: overlay.location,
              }
            : {}),
        };
      });
      setProperties(withImages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className="min-h-screen">
      <style>{marqueeStyles}</style>
      <Seo
        title="NH&T Estates - Luxury Airbnbs & Property Management"
        description="Experience unparalleled luxury with NH&T Estates. Premium coastal properties with world-class spa and cinema amenities."
        canonicalPath="/"
        keywords={[
          'luxury stays',
          'serviced apartments Cardiff',
          'coastal properties',
          'luxury airbnbs',
          'property management',
          'private spa',
          'private cinema',
          'Cardiff accommodation',
        ]}
      />
      {/* HERO */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <picture className="absolute inset-0">
          <source srcSet="/homepage2.webp" media="(max-width: 768px)" type="image/webp" />
          <source srcSet="/homepage2.webp" type="image/webp" />
          <img
            src="/homepage2.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            width="1920"
            height="1080"
            className="w-full h-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center text-white max-w-4xl px-4">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">
            Luxury Redefined
          </h1>
          <p className="text-xl md:text-2xl mb-10">
            Experience unparalleled comfort in Cardiff
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="flex"
              style={{alignItems:'center'}}
              onClick={() =>
                document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Properties <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Link to="/spa">
              <Button size="lg" variant="outline" className="border-white text-white">
                Book Spa Experience
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PROPERTIES */}
      <section id="properties" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-center mb-12">
            Featured Properties
          </h2>

          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((p) => (
                <a
                  key={p.id}
                  href={p.airbnb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
                >
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="h-64 w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-serif mb-2">{p.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{p.location}</p>
                    <p className="line-clamp-2 text-gray-700 mb-4">{p.description}</p>
                    <div className="flex justify-between text-sm">
                      <span>{p.bedrooms} Bedrooms</span>
                      <span className="font-semibold">£{p.price_per_night}/night</span>
                    </div>
                  </div>
                </a>
              ))}
              </div>
              <div className="mt-12 text-center">
                <Link to="/properties">
                  <Button size="lg" className="mx-auto flex" style={{alignItems:'center'}}>
                    Explore All Properties <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SPA CAROUSEL */}
      <AmenityCarousel
        images={SPA_CAROUSEL_IMAGES}
        bookingPath="/spa"
        bookingLabel="Book Spa Experience"
        sectionTitle="Spa Experiences"
      />

      {/* CINEMA CAROUSEL */}
      <AmenityCarousel
        images={CINEMA_CAROUSEL_IMAGES}
        bookingPath="/cinema"
        bookingLabel="Reserve Cinema"
        sectionTitle="Cinema Experiences"
      />

      {/* TESTIMONIALS (CSS marquee, no Embla/JS) */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex items-center gap-6 justify-center">
            <span className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-amber-400/60" />
            <h2 className="text-4xl font-serif text-center">
              Guest Testimonials
            </h2>
            <span className="flex-1 max-w-[120px] h-px bg-gradient-to-l from-transparent to-amber-400/60" />
          </div>
        </div>

        <div className="marquee-wrapper">
          <div className="marquee-track">
            {marqueeItems.map((t, i) => (
              <div
                key={i}
                className="min-w-[300px] max-w-[300px] bg-white p-6 rounded-xl shadow mx-3 flex-shrink-0"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="italic mb-4 text-gray-700">"{t.text}"</p>
                <p className="font-semibold text-gray-900">{t.name}</p>
                {t.location && (
                  <p className="text-sm text-gray-500">{t.location}</p>
                )}
                {t.date && (
                  <p className="text-sm text-gray-400">{t.date}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* READY TO EXPERIENCE LUXURY CTA */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
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

export default memo(HomePage);
