export interface Property {
  id: string;
  title: string;
  description: string;
  image_url: string;
  airbnb_url: string;
  location: string;
  price_per_night: number;
  bedrooms: number;
  sleeps: number;
  rating: number;
}

export const normalizeLocation = (location: string): string => {
  const lowerLocation = location.toLowerCase();
  if (
    lowerLocation.includes('penylan') ||
    lowerLocation.includes('roath') ||
    lowerLocation.includes('cardiff centre') ||
    lowerLocation.includes('cardiff city centre')
  ) {
    return 'City Centre';
  }
  return location;
};

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const renderStars = () => {
    const fullStars = Math.floor(property.rating);
    const hasHalfStar = property.rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, index) => (
          <span key={index} className="text-yellow-400 text-lg">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400 text-lg">☆</span>}
        {[...Array(emptyStars)].map((_, index) => (
          <span key={index} className="text-gray-300 text-lg">☆</span>
        ))}
      </div>
    );
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex-shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] flex flex-col">
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.image_url}
          alt={property.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg">
          <span className="text-blue-900 font-serif font-semibold">
            £{property.price_per_night}/night
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-serif text-gray-900 mb-2 group-hover:text-blue-900 transition-colors line-clamp-1">
          {property.title}
        </h3>
        <p className="text-gray-600 text-xs mb-3 line-clamp-1">
          {normalizeLocation(property.location)}
        </p>

        <div className="mb-3">
          {renderStars()}
        </div>

        <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2 text-sm flex-grow">
          {property.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>{property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
          <span>Sleeps {property.sleeps}</span>
        </div>

        <a
          href={property.airbnb_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-900 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-800 transition-colors duration-200 mt-auto"
          onClick={(event) => event.stopPropagation()}
        >
          More Info
        </a>
      </div>
    </div>
  );
}
