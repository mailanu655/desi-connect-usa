'use client';

import type { SearchContentType, SearchFacets } from '@desi-connect-usa/shared/src/types';
import { SEARCH_CONTENT_TYPES, getContentTypeIcon } from '@/lib/search';

interface SearchFiltersProps {
  selectedTypes: SearchContentType[];
  onTypesChange: (types: SearchContentType[]) => void;
  facets?: SearchFacets;
  selectedCity?: string;
  onCityChange: (city: string) => void;
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

export default function SearchFilters({
  selectedTypes,
  onTypesChange,
  facets,
  selectedCity,
  onCityChange,
  selectedCategory,
  onCategoryChange,
}: SearchFiltersProps) {
  const handleTypeToggle = (type: SearchContentType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleClearTypes = () => {
    onTypesChange([]);
  };

  return (
    <div className="space-y-6" data-testid="search-filters">
      {/* Content Type Filters */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Content Type</h3>
          {selectedTypes.length > 0 && (
            <button
              onClick={handleClearTypes}
              className="text-xs text-orange-600 hover:text-orange-700"
              data-testid="clear-types"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {SEARCH_CONTENT_TYPES.filter((ct) => ct.type !== 'forum').map((config) => {
            const isSelected = selectedTypes.includes(config.type);
            const facetCount = facets?.content_types.find(
              (f) => f.value === config.type
            )?.count;

            return (
              <button
                key={config.type}
                onClick={() => handleTypeToggle(config.type)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-orange-50 text-orange-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`type-filter-${config.type}`}
              >
                <span className="flex items-center gap-2">
                  <span>{getContentTypeIcon(config.type)}</span>
                  <span>{config.plural}</span>
                </span>
                {facetCount !== undefined && (
                  <span className="text-xs text-gray-400">{facetCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* City Facets */}
      {facets && facets.cities.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">City</h3>
          <div className="space-y-1">
            {selectedCity && (
              <button
                onClick={() => onCityChange('')}
                className="mb-1 text-xs text-orange-600 hover:text-orange-700"
                data-testid="clear-city"
              >
                Clear city filter
              </button>
            )}
            {facets.cities.slice(0, 8).map((facet) => (
              <button
                key={facet.value}
                onClick={() => onCityChange(facet.value)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  selectedCity === facet.value
                    ? 'bg-orange-50 text-orange-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`city-filter-${facet.value}`}
              >
                <span>{facet.label}</span>
                <span className="text-xs text-gray-400">{facet.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Facets */}
      {facets && facets.categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Category</h3>
          <div className="space-y-1">
            {selectedCategory && (
              <button
                onClick={() => onCategoryChange('')}
                className="mb-1 text-xs text-orange-600 hover:text-orange-700"
                data-testid="clear-category"
              >
                Clear category filter
              </button>
            )}
            {facets.categories.slice(0, 10).map((facet) => (
              <button
                key={facet.value}
                onClick={() => onCategoryChange(facet.value)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  selectedCategory === facet.value
                    ? 'bg-orange-50 text-orange-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`category-filter-${facet.value}`}
              >
                <span>{facet.label}</span>
                <span className="text-xs text-gray-400">{facet.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
