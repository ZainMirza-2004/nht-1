import { ChevronRight } from 'lucide-react';
import PropertyCard, { Property } from './PropertyCard';

interface PropertyGroupProps {
  city: string;
  properties: Property[];
}

export default function PropertyGroup({ city, properties }: PropertyGroupProps) {
  if (properties.length === 0) return null;

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-serif text-gray-900">{city}</h2>
        <ChevronRight className="h-6 w-6 text-gray-400" />
      </div>
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}
