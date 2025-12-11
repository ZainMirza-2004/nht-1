import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PropertyOption {
  id: string;
  label: string;
  children?: PropertyOption[];
}

const properties: PropertyOption[] = [
  {
    id: 'nht16',
    label: 'NHT 16',
    children: [
      { id: 'nht16-flat-a', label: 'Flat A' },
      { id: 'nht16-flat-b', label: 'Flat B' },
      { id: 'nht16-flat-c', label: 'Flat C' },
      { id: 'nht16-flat-d', label: 'Flat D' },
    ],
  },
  {
    id: 'nht18',
    label: 'NHT 18',
    children: [
      { id: 'nht18-flat-1', label: 'Flat 1' },
      { id: 'nht18-flat-2', label: 'Flat 2' },
      { id: 'nht18-flat-4', label: 'Flat 4' },
    ],
  },
  { id: 'cinema-studio-1', label: 'Cinema Studio 1' },
  { id: 'cinema-studio-2', label: 'Cinema Studio 2' },
];

interface HierarchicalPropertySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
}

export default function HierarchicalPropertySelect({
  value,
  onChange,
  required = false,
  label = 'Property',
}: HierarchicalPropertySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getDisplayValue = () => {
    if (!value) return '';
    
    const findLabel = (items: PropertyOption[], targetId: string): string | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return item.label;
        }
        if (item.children) {
          const childLabel = findLabel(item.children, targetId);
          if (childLabel) {
            return `${item.label} - ${childLabel}`;
          }
        }
      }
      return null;
    };

    return findLabel(properties, value) || value;
  };

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const renderOption = (option: PropertyOption, level: number = 0) => {
    const isGroup = !!option.children;
    const isExpanded = expandedGroups.has(option.id);
    const isSelected = value === option.id;

    if (isGroup) {
      return (
        <div key={option.id}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleGroup(option.id);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${
              level > 0 ? 'pl-8' : ''
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <span className="font-medium text-gray-900">{option.label}</span>
          </div>
          {isExpanded && option.children && (
            <div className="bg-gray-50/50">
              {option.children.map((child) => renderOption(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={option.id}
        onClick={() => handleSelect(option.id)}
        className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors ${
          level > 0 ? 'pl-12' : 'pl-8'
        } ${isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'text-gray-700'}`}
      >
        {option.label}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 focus:outline-none bg-white transition-all duration-200 text-left flex items-center justify-between ${
          isOpen ? 'ring-2 ring-blue-900 border-blue-900' : ''
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? getDisplayValue() : 'Select your property'}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {properties.map((property) => renderOption(property))}
        </div>
      )}
    </div>
  );
}

