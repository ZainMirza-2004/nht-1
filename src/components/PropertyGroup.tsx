import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import PropertyCard, { Property } from './PropertyCard';

interface PropertyGroupProps {
  city: string;
  properties: Property[];
}

export default function PropertyGroup({ city, properties }: PropertyGroupProps) {
  if (properties.length === 0) return null;

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollByAmount = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };
  const SCROLL_AMOUNT = 360;

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-serif text-gray-900">{city}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll properties left"
            onClick={() => scrollByAmount(-SCROLL_AMOUNT)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll properties right"
            onClick={() => scrollByAmount(SCROLL_AMOUNT)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8"
        >
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}
