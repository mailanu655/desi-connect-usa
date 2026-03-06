'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { groupSavedItemsByType, formatSavedDate } from '@/lib/user-profile';
import type { SavedItem } from '@/lib/api-client';
import type { ContentType } from '@desi-connect/shared';

const ITEM_TYPES: ContentType[] = ['business', 'event', 'deal', 'job', 'news', 'review'];

export default function SavedItemsPage() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSavedItems() {
      try {
        setLoading(true);
        const data = await apiClient.getSavedItems({ limit: 100 });
        setSavedItems(data.data || []);
      } catch (err) {
        console.error('Error fetching saved items:', err);
        setError('Failed to load saved items');
      } finally {
        setLoading(false);
      }
    }

    fetchSavedItems();
  }, []);

  const handleRemoveItem = async (savedId: string) => {
    try {
      setRemovingId(savedId);
      await apiClient.removeSavedItem(savedId);
      setSavedItems((prev) => prev.filter((item) => item.saved_id !== savedId));
    } catch (err) {
      console.error('Error removing saved item:', err);
      setError('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" />
        <p className="mt-2 text-gray-500">Loading saved items...</p>
      </div>
    );
  }

  const grouped = groupSavedItemsByType(savedItems);
  const filteredItems =
    selectedType === 'all' ? savedItems : grouped[selectedType] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
        <p className="mt-2 text-gray-600">Your favorite businesses, deals, and more</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedType === 'all'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({savedItems.length})
        </button>
        {ITEM_TYPES.map((type) => {
          const count = (grouped[type] || []).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                selectedType === type
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
            />
          </svg>
          <p className="text-gray-500 text-lg">No saved items yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Save your favorite items to access them later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.saved_id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              {item.item_image_url && (
                <img
                  src={item.item_image_url}
                  alt={item.item_title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {item.item_title}
                </h3>

                {item.item_subtitle && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {item.item_subtitle}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {item.item_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatSavedDate(item.saved_at)}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.saved_id)}
                  disabled={removingId === item.saved_id}
                  className="mt-4 w-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {removingId === item.saved_id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
