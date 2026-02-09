import { useMemo, useState } from 'react';
import { Property } from '../components/PropertyCard';
import FilterPill, { FilterState } from '../components/FilterPill';
import PropertyGroup from '../components/PropertyGroup';
import Seo from '../components/Seo';

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Luxury Victorian Flat',
    description:
      "Stay in luxury at this stunning Victorian 2-bedroom flat in the heart of Cardiff city centre, right next to the Principality Stadium and Cardiff Central Station. This elegant listed building blends classic charm with modern comfort. Sleeps up to 8 guests with stylish decor, city views, and on-site parking -- all just steps from Cardiff's best shopping, dining, and nightlife.",
    image_url: '/2bed.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 190,
    bedrooms: 2,
    sleeps: 8,
    rating: 5,
    airbnb_url:
      'https://www.airbnb.co.uk/rooms/1553108401152199815?source_impression_id=p3_1763320422_P3Yt8Uqgn7jPHmt7',
  },
  {
    id: '2',
    title: 'Luxury Penylan Apartment',
    description:
      'Stay in a stylish 2-bed flat featuring a royal-blue bedroom and a golden-accented room, each designed with luxe materials and suede touches. Just 2 mins from Cardiff city centre, enjoy a modern kitchen/living space, fast WiFi and comfy beds. Upgrade your stay with our bookable jacuzzi and on-site cinema. Perfect for couples, groups and families.',
    image_url: '/2bedPenylan.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 190,
    bedrooms: 2,
    sleeps: 5,
    rating: 5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/roath/cardiff-centre-2br-sleeps-5-jacuzzi-%2526-free-parking/923ad4?number_of_guests=1',
  },
  {
    id: '3',
    title: 'Modern Penylan Flat',
    description:
      'Stay in a modern 1-bed flat in central Cardiff, just a 2-min walk to the city centre, top restaurants, shops and nightlife. Perfect for couples, families and groups, with a comfy double bed and suede sofa bed. Enjoy free parking, fast WiFi and a brand-new kitchen/living space. Bookable spa access available as a paid amenity.',
    image_url: '/1bedpenylan.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 140,
    bedrooms: 1,
    sleeps: 4,
    rating: 4.5,
    airbnb_url:
      'https://www.airbnb.co.uk/rooms/1553275092504034566?source_impression_id=p3_1763321949_P3jk08WKMpPMNfyW',
  },
  {
    id: '4',
    title: 'Emerald Luxury Penylan Flat',
    description:
      'Immerse yourself in an emerald-themed, gold-accented 1-bed flat styled with suede leather and luxe finishes. Just 2 mins from Cardiff city centre, enjoy a comfy double bed, sofa bed, fast WiFi and a modern kitchen/living space. Enhance your stay with our bookable spa and onsite cinema experience. Perfect for couples, solo travellers or 3 friends.',
    image_url: '/1bedPenylann.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 140,
    bedrooms: 1,
    sleeps: 3,
    rating: 5,
    airbnb_url:
      'https://www.airbnb.co.uk/rooms/1553799390114160128?source_impression_id=p3_1763323934_P3Zg3z3ob8TyeHEW',
  },
  {
    id: '5',
    title: 'Private Cinema Studio',
    description:
      'Make your stay a full date-night experience. Check in at 6pm after exploring Cardiff and enjoying dinner, then unwind in your private cinema studio with a 100" screen and cozy sofa bed. Book a jacuzzi or spa session and receive your own key to the facility for maximum privacy. The studio includes a kitchenette with kettle, microwave, toaster and complimentary tea, coffee and sugar - perfect for a romantic, unforgettable escape.',
    image_url: '/Cinemaroomrental.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 140,
    bedrooms: 1,
    sleeps: 2,
    rating: 5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/roath/new-cinema-experience-in-cardiff-for-couples-%252B-spa/50215a?number_of_guests=1',
  },
  {
    id: '6',
    title: 'Stylish Cardiff Centre Apartment',
    description:
      'Relax in this stylish and modern 2-bedroom flat in the heart of Cardiff, just a 2-minute walk from the city centre, restaurants, cafes and nightlife. Features two spacious double bedrooms, a comfortable suede leather sofa bed, and a brand-new hybrid kitchen/living space perfect for cooking, dining and socialising. Ideal for couples, friends, families and groups. Book access to our on-site spa for an added touch of luxury.',
    image_url: '/2bedrental.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 190,
    bedrooms: 2,
    sleeps: 6,
    rating: 5,
    airbnb_url:
      'https://www.airbnb.co.uk/rooms/1553231471141991222?source_impression_id=p3_1763323934_P3tnsgJmCUsix9vE',
  },
  {
    id: '7',
    title: 'Central Wembley Stadium Stay',
    description:
      'Stay in the heart of Wembley, just moments from the iconic Wembley Stadium. This spacious 2-bedroom accommodation sleeps up to 6 guests and features modern amenities, comfortable furnishings, and convenient on-site parking. Perfect for sports fans, concert-goers, or anyone looking to explore London. Enjoy easy access to public transport and local attractions.',
    image_url: '/Property7.webp',
    location: 'London',
    price_per_night: 200,
    bedrooms: 2,
    sleeps: 6,
    rating: 5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/greater-london/central-wembley-stadium-stay-%25E2%2580%25A2-sleeps-6-%25E2%2580%25A2-parking/ffb684?number_of_guests=1',
  },
  {
    id: '8',
    title: 'Highrise Stay by Wembley Stadium',
    description:
      'Experience luxury living in this stunning highrise apartment with breathtaking views, located just steps from Wembley Stadium. This modern 3-bedroom property features premium amenities including on-site parking and access to a pool. Perfect for families or groups looking for a comfortable and convenient base to explore London. Enjoy the vibrant atmosphere of Wembley with world-class entertainment right on your doorstep.',
    image_url: '/Property8.webp',
    location: 'London',
    price_per_night: 280,
    bedrooms: 3,
    sleeps: 8,
    rating: 5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/greater-london/highrise-stay-by-wembley-stadium---parking---pool/428db3?number_of_guests=1',
  },
  {
    id: '9',
    title: 'The Walk Cardiff Centre Sleep 4 + FREE Parking',
    description:
      "Discover this brand new 2-bedroom flat in the heart of Cardiff city centre. Perfect for up to 4 guests, this modern accommodation features contemporary design, comfortable furnishings, and the convenience of free parking. Located just minutes from Cardiff's best shopping, dining, and entertainment, this is the ideal base for exploring the Welsh capital.",
    image_url: '/Property9.webp',
    location: 'Cardiff City Centre, Cardiff',
    price_per_night: 190,
    bedrooms: 2,
    sleeps: 4,
    rating: 4.5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/roath/new-2br-flat-cardiff-centre-sleep-4-%252B-free-parking/12eedc?number_of_guests=1',
  },
  {
    id: '10',
    title: 'Central 1BR Cardiff Flat & Free Parking + Paid Spa',
    description:
      'Stay in this central 1-bedroom flat located at 16 The Walk in Roath, Cardiff. This modern accommodation features a comfortable double bed, contemporary kitchen/living space, and free parking. Enhance your stay with access to our paid spa facilities. Perfect for couples or solo travellers looking for a convenient and comfortable base in Cardiff.',
    image_url: '/Property10.webp',
    location: 'Roath, Cardiff',
    price_per_night: 140,
    bedrooms: 1,
    sleeps: 2,
    rating: 5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/roath/central-1br-cardiff-flat-%2526-free-parking-%252B-paid-spa/6d92e0?number_of_guests=1',
  },
  {
    id: '11',
    title: '2 mins to city centre | Cinema + Private Spa + Parking',
    description:
      'Experience the ultimate luxury stay just 2 minutes from Cardiff city centre. This stunning 2-bedroom property features a private cinema room for movie nights, access to a private spa for relaxation, and convenient on-site parking. Perfect for couples, families, or groups looking for a premium accommodation experience with exceptional amenities.',
    image_url: '/Property11.webp',
    location: 'Roath, Cardiff',
    price_per_night: 220,
    bedrooms: 2,
    sleeps: 6,
    rating: 5,
    airbnb_url:
      'https://nhtestates.bookeddirectly.com/g/roath/2-mins-to-city-centre%257C-cinema%252Bprivate-spa-%252Bparking/8778ab?number_of_guests=1',
  },
  {
    id: '12',
    title: 'Breathtaking London Skyline River Penthouse',
    description:
      'Luxury penthouse with panoramic London skyline and River Thames views. Spacious open-plan living area, modern kitchen, Smart TVs, and ideal for families or groups seeking premium comfort.',
    image_url: '/Property12.webp',
    location: 'London',
    price_per_night: 270,
    bedrooms: 4,
    sleeps: 10,
    rating: 5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1596672242135882242',
  },
  {
    id: '13',
    title: 'Spacious 3BR Near Wembley Stadium | Sleeps Large Groups',
    description:
      'Stylish three-bedroom home close to Wembley Stadium, perfect for groups and families. Features multiple beds, balcony, Smart TVs in rooms, and excellent transport access.',
    image_url: '/Property13.webp',
    location: 'London',
    price_per_night: 280,
    bedrooms: 3,
    sleeps: 8,
    rating: 4,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1578566450881252634',
  },
  {
    id: '14',
    title: 'Wembley Central 2BR Apartment Near Stadium',
    description:
      'Comfortable two-bedroom apartment near Wembley Stadium with bright living areas and convenient transport links. Ideal for short city stays and events.',
    image_url: '/Property14.webp',
    location: 'London',
    price_per_night: 280,
    bedrooms: 2,
    sleeps: 4,
    rating: 5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1569024208665809983',
  },
  {
    id: '15',
    title: 'Central London 1BR Apartment | Sleeps Up to 6',
    description:
      'Modern one-bedroom apartment in East London (E16 1YT) with convenient access to transport links and city attractions.',
    image_url: '/Property15.webp',
    location: 'London',
    price_per_night: 270,
    bedrooms: 1,
    sleeps: 6,
    rating: 4.5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1587290956231310709',
  },
  {
    id: '16',
    title: 'London 1BR Apartment with Free Parking',
    description:
      'Cozy one-bedroom London apartment (SE8 5EJ) with free parking, Smart TV, and fully equipped kitchen.',
    image_url: '/Property16.webp',
    location: 'London',
    price_per_night: 270,
    bedrooms: 1,
    sleeps: 4,
    rating: 5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1586554811765279759',
  },
  {
    id: '17',
    title: 'Modern London 1BR Flat with Balcony',
    description:
      'Comfortable one-bedroom flat featuring a private balcony, free parking, and good transport connections, ideal for short and long stays.',
    image_url: '/Property17.webp',
    location: 'London',
    price_per_night: 260,
    bedrooms: 1,
    sleeps: 3,
    rating: 5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1588015555146815839',
  },
  {
    id: '18',
    title: 'Duplex Riverfront Penthouse | Sleeps Large Groups',
    description:
      'Spacious duplex penthouse with river views, private balcony, modern furnishings, and open-plan living, perfect for families and group stays.',
    image_url: '/Property18.webp',
    location: 'London',
    price_per_night: 290,
    bedrooms: 3,
    sleeps: 8,
    rating: 5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1580012826020703826',
  },
  {
    id: '19',
    title: 'Victorian House Near Canary Wharf | Entire Home',
    description:
      'Large three-bedroom Victorian house near Canary Wharf with garden, full kitchen, Smart TVs, and great access to transport and shops.',
    image_url: '/Property19.webp',
    location: 'London',
    price_per_night: 400,
    bedrooms: 3,
    sleeps: 10,
    rating: 5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1587995690983500419',
  },
  {
    id: '20',
    title: 'City Stay Riverside Apartment | Central Location',
    description:
      'Renovated riverside apartment with balcony, modern interior, fast Wi-Fi, and comfortable sleeping for families or groups.',
    image_url: '/Property20.webp',
    location: 'London',
    price_per_night: 200,
    bedrooms: 2,
    sleeps: 5,
    rating: 4.5,
    airbnb_url: 'https://www.airbnb.co.uk/rooms/1572660509687736611',
  },
];

export default function ExploreAllProperties() {
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'none',
  });


  const locations = useMemo(() => {
    const uniqueLocations = new Set(mockProperties.map((property) => property.location));
    return Array.from(uniqueLocations).sort();
  }, []);

  const filteredAndSortedProperties = useMemo(() => {
    let result = [...mockProperties];

    if (filters.location) {
      result = result.filter((property) => property.location === filters.location);
    }

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      result = result.filter((property) => property.price_per_night >= minPrice);
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      result = result.filter((property) => property.price_per_night <= maxPrice);
    }

    if (filters.sortBy === 'price-low') {
      result.sort((a, b) => a.price_per_night - b.price_per_night);
    } else if (filters.sortBy === 'price-high') {
      result.sort((a, b) => b.price_per_night - a.price_per_night);
    }

    return result;
  }, [filters]);

  const groupedProperties = useMemo(() => {
    const groups: Record<string, Property[]> = {};

    filteredAndSortedProperties.forEach((property) => {
      const city = property.location.split(',')[0].trim();
      if (!groups[city]) {
        groups[city] = [];
      }
      groups[city].push(property);
    });

    return groups;
  }, [filteredAndSortedProperties]);

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <Seo
        title="NH&T Estates - Explore All Properties"
        description="Browse the full NH&T Estates collection of luxury properties, from Cardiff to London. Filter by location and price to find the perfect stay."
        canonicalPath="/properties"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
            All Properties
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore luxury properties in Cardiff and London with refined interiors, curated amenities,
            and seamless booking. From elegant apartments to private room stays, every space is selected
            for comfort, style, and location.
          </p>
          <p className="text-base text-gray-600 max-w-3xl mx-auto mt-4">
            Use filters to find the right apartment and room booking for your stay. Expect thoughtful
            details, premium bedding, fast connectivity, and concierge-ready support throughout your visit.
          </p>
        </div>

        <div className="mb-12">
          <FilterPill filters={filters} onFilterChange={setFilters} locations={locations} />
        </div>
        <div className="max-w-4xl mx-auto mb-12 text-gray-600 leading-relaxed">
          <p className="mb-4">
            This collection is designed for Luxury Properties booking with the comfort of home and the
            polish of a hotel. Expect apartment and room booking options that are well-located, beautifully
            presented, and supported by concierge care. Every property includes a clear list of amenities
            so you know exactly what is included before you arrive.
          </p>
          <p>
            From short city breaks to longer stays, our rooms and apartments offer reliable Wi-Fi,
            premium bedding, and a thoughtful layout that balances privacy with convenience. Filter by
            location and price to find your ideal stay in Cardiff or London.
          </p>
        </div>

        {Object.keys(groupedProperties).length > 0 ? (
          <div>
            {Object.entries(groupedProperties).map(([city, properties]) => (
              <PropertyGroup key={city} city={city} properties={properties} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">No properties found</p>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>
    </div>
  );
}
