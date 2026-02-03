import { useState } from 'react';
import { MapPin, DollarSign, ArrowUpDown, X } from 'lucide-react';

export interface FilterState {
  location: string;
  minPrice: string;
  maxPrice: string;
  sortBy: 'price-low' | 'price-high' | 'none';
}

interface FilterPillProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  locations: string[];
}

export default function FilterPill({ filters, onFilterChange, locations }: FilterPillProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const handleLocationSelect = (location: string) => {
    onFilterChange({ ...filters, location });
    setIsLocationOpen(false);
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleSortSelect = (sortBy: 'price-low' | 'price-high' | 'none') => {
    onFilterChange({ ...filters, sortBy });
    setIsSortOpen(false);
  };

  const clearLocation = () => {
    onFilterChange({ ...filters, location: '' });
  };

  const clearPrice = () => {
    onFilterChange({ ...filters, minPrice: '', maxPrice: '' });
  };

  const clearSort = () => {
    onFilterChange({ ...filters, sortBy: 'none' });
  };

  const hasActiveFilters = filters.location || filters.minPrice || filters.maxPrice || filters.sortBy !== 'none';

  return (
    <div className="bg-white rounded-full shadow-lg border-2 border-blue-900 p-2 sm:p-3 flex flex-wrap items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
      {/* Location Filter */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => {
            setIsLocationOpen(!isLocationOpen);
            setIsPriceOpen(false);
            setIsSortOpen(false);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-200 ${
            filters.location
              ? 'bg-blue-900 text-white'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
          }`}
        >
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {filters.location || 'Location'}
          </span>
          {filters.location && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearLocation();
              }}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>
        {isLocationOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsLocationOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => handleLocationSelect('')}
                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm ${
                    !filters.location ? 'bg-blue-50 text-blue-900 font-medium' : ''
                  }`}
                >
                  All Locations
                </button>
                {locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                    className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm ${
                      filters.location === location
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : ''
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => {
            setIsPriceOpen(!isPriceOpen);
            setIsLocationOpen(false);
            setIsSortOpen(false);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-200 ${
            filters.minPrice || filters.maxPrice
              ? 'bg-blue-900 text-white'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {filters.minPrice || filters.maxPrice
              ? `£${filters.minPrice || '0'}-£${filters.maxPrice || '∞'}`
              : 'Price'}
          </span>
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPrice();
              }}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>
        {isPriceOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsPriceOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 p-4 min-w-[280px]">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Price (£/night)
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Price (£/night)
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    placeholder="No limit"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sort Filter */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsLocationOpen(false);
            setIsPriceOpen(false);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-200 ${
            filters.sortBy !== 'none'
              ? 'bg-blue-900 text-white'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
          }`}
        >
          <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {filters.sortBy === 'price-low'
              ? 'Low to High'
              : filters.sortBy === 'price-high'
              ? 'High to Low'
              : 'Sort'}
          </span>
          {filters.sortBy !== 'none' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSort();
              }}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>
        {isSortOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsSortOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 min-w-[200px]">
              <div className="p-2">
                <button
                  onClick={() => handleSortSelect('none')}
                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm ${
                    filters.sortBy === 'none' ? 'bg-blue-50 text-blue-900 font-medium' : ''
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => handleSortSelect('price-low')}
                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm ${
                    filters.sortBy === 'price-low' ? 'bg-blue-50 text-blue-900 font-medium' : ''
                  }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => handleSortSelect('price-high')}
                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm ${
                    filters.sortBy === 'price-high' ? 'bg-blue-50 text-blue-900 font-medium' : ''
                  }`}
                >
                  Price: High to Low
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onFilterChange({ location: '', minPrice: '', maxPrice: '', sortBy: 'none' })}
          className="ml-auto px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-900 transition-colors whitespace-nowrap"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
