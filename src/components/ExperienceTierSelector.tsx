import { useState, useEffect } from 'react';
import { Check, Sparkles, Star } from 'lucide-react';

export type ExperienceTier = 'standard' | 'premium' | 'deluxe';

export interface TierOption {
  id: ExperienceTier;
  name: string;
  price: number;
  features: string[];
  badge?: string;
  popular?: boolean;
  description?: string;
  priceSubtext?: string;
}

interface ExperienceTierSelectorProps {
  tiers: TierOption[];
  selectedTier: ExperienceTier | null;
  onSelectTier: (tier: ExperienceTier) => void;
  defaultTier?: ExperienceTier;
}

export default function ExperienceTierSelector({
  tiers,
  selectedTier,
  onSelectTier,
  defaultTier = 'premium',
}: ExperienceTierSelectorProps) {
  const [highlightedTier, setHighlightedTier] = useState<ExperienceTier | null>(
    selectedTier || defaultTier
  );

  // Auto-select default tier if none selected
  useEffect(() => {
    if (!selectedTier && defaultTier) {
      onSelectTier(defaultTier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleTierClick = (tierId: ExperienceTier) => {
    onSelectTier(tierId);
    setHighlightedTier(tierId);
  };

  const getTierStyles = (tier: TierOption, isSelected: boolean) => {
    const baseStyles = 'relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-500 transform';
    
    if (isSelected) {
      if (tier.id === 'deluxe') {
        return `${baseStyles} border-[#C9A961] bg-gradient-to-br from-[#F5E6D3] to-[#E8D5B7] shadow-lg shadow-[#C9A961]/30 scale-[1.02]`;
      } else if (tier.id === 'premium') {
        return `${baseStyles} border-blue-900 bg-blue-900/5 shadow-lg shadow-blue-900/20 scale-[1.02]`;
      } else {
        return `${baseStyles} border-gray-300 bg-gray-50 shadow-md scale-[1.02]`;
      }
    } else {
      return `${baseStyles} border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-[1.01]`;
    }
  };

  const getPriceColor = (tier: TierOption) => {
    if (tier.id === 'deluxe') return 'text-[#8B6914]';
    if (tier.id === 'premium') return 'text-blue-900';
    return 'text-gray-700';
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const isPopular = tier.popular || tier.id === 'premium';

          return (
            <div
              key={tier.id}
              onClick={() => handleTierClick(tier.id)}
              className={getTierStyles(tier, isSelected)}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Popular Badge */}
              {isPopular && !tier.badge && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 rounded-full p-1.5 shadow-md">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Tier Name */}
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h4>
                {tier.description && (
                  <p className="text-sm text-gray-600">{tier.description}</p>
                )}
              </div>

              {/* Price */}
              <div className={`text-center mb-6 ${getPriceColor(tier)}`}>
                <div className="text-4xl font-serif font-bold mb-1">£{tier.price}</div>
                <div className="text-sm text-gray-600">per session</div>
                {tier.priceSubtext && (
                  <div className="text-xs text-gray-500 mt-1 font-light">{tier.priceSubtext}</div>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isSelected 
                        ? tier.id === 'deluxe' ? 'text-[#8B6914]' 
                        : tier.id === 'premium' ? 'text-blue-900' 
                        : 'text-gray-600'
                        : 'text-gray-400'
                    }`} />
                    <span className={`text-sm ${
                      isSelected ? 'text-gray-800 font-medium' : 'text-gray-600'
                    }`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                type="button"
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  isSelected
                    ? tier.id === 'deluxe'
                      ? 'bg-[#C9A961] !text-white hover:bg-[#B8860B] shadow-md'
                      : tier.id === 'premium'
                      ? 'bg-blue-900 text-white hover:bg-blue-800 shadow-md'
                      : 'bg-gray-700 text-white hover:bg-gray-800 shadow-md'
                    : tier.id === 'deluxe'
                    ? 'bg-[#F5E6D3] text-[#8B6914] hover:bg-[#E8D5B7] border-2 border-[#C9A961]'
                    : tier.id === 'premium'
                    ? 'bg-blue-900/10 text-blue-900 hover:bg-blue-900/20 border-2 border-blue-900/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTierClick(tier.id);
                }}
              >
                {isSelected ? (
                  'Selected'
                ) : tier.id === 'premium' ? (
                  'Upgrade to Premium'
                ) : tier.id === 'deluxe' ? (
                  'Upgrade to Deluxe'
                ) : (
                  'Select Standard'
                )}
              </button>

              {/* Value Proposition */}
              {tier.id === 'premium' && !isSelected && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-blue-900 font-medium flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Best Value - Most Popular Choice
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

