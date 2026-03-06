'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { METRO_AREAS } from '@/lib/constants';

const EVENT_CATEGORIES = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'professional', label: 'Professional' },
  { value: 'religious', label: 'Religious' },
  { value: 'social', label: 'Social' },
  { value: 'educational', label: 'Educational' },
  { value: 'sports', label: 'Sports' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'other', label: 'Other' },
];

function EventSubmitForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    venue_name: '',
    address: '',
    city: '',
    state: '',
    is_virtual: false,
    virtual_url: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    organizer_name: '',
    organizer_contact: '',
    ticket_url: '',
    is_free: true,
    price: '',
    image_url: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate required fields
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.city ||
      !formData.state ||
      !formData.start_date
    ) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time into ISO string
      const startDateTime = formData.start_date
        ? `${formData.start_date}T${formData.start_time || '00:00'}`
        : undefined;
      const endDateTime = formData.end_date
        ? `${formData.end_date}T${formData.end_time || '00:00'}`
        : undefined;

      const response = await fetch('/api/events/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          venue_name: formData.venue_name || null,
          address: formData.address || null,
          city: formData.city,
          state: formData.state,
          is_virtual: formData.is_virtual,
          virtual_url: formData.virtual_url || null,
          starts_at: startDateTime,
          ends_at: endDateTime,
          organizer_name: formData.organizer_name || null,
          organizer_contact: formData.organizer_contact || null,
          ticket_url: formData.ticket_url || null,
          is_free: formData.is_free,
          price: formData.price || null,
          image_url: formData.image_url || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit event');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/events');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-gradient-to-r from-saffron-500 to-orange-600 py-12 sm:py-16">
        <div className="container-page">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/events" className="text-white/80 hover:text-white transition-colors">
              ← Back to Events
            </Link>
          </div>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl mb-2">
            Submit an Event
          </h1>
          <p className="text-lg text-white/90">
            Share your community event with Indian diaspora across America
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 sm:py-16">
        <div className="container-page max-w-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Your event has been submitted. Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                Basic Information
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="e.g., Annual Diwali Celebration"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 min-h-32"
                    placeholder="Describe your event..."
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                Location
              </h2>

              <div className="space-y-4">
                {/* Virtual Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_virtual"
                    name="is_virtual"
                    checked={formData.is_virtual}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-saffron-600"
                  />
                  <label htmlFor="is_virtual" className="text-sm font-medium text-gray-700">
                    This is a virtual event
                  </label>
                </div>

                {!formData.is_virtual && (
                  <>
                    {/* Venue Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        name="venue_name"
                        value={formData.venue_name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                        placeholder="e.g., Community Center"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                        placeholder="e.g., 123 Main St"
                      />
                    </div>
                  </>
                )}

                {formData.is_virtual && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Virtual URL / Meeting Link
                    </label>
                    <input
                      type="url"
                      name="virtual_url"
                      value={formData.virtual_url}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      placeholder="e.g., https://zoom.us/..."
                    />
                  </div>
                )}

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      placeholder="e.g., New York"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      required
                    >
                      <option value="">Select state</option>
                      {METRO_AREAS.map((area) => (
                        <option key={area.state} value={area.state}>
                          {area.state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                Date & Time
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Info */}
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                Organizer Information
              </h2>

              <div className="space-y-4">
                {/* Organizer Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    name="organizer_name"
                    value={formData.organizer_name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="e.g., Community Association"
                  />
                </div>

                {/* Organizer Contact */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email / Phone
                  </label>
                  <input
                    type="text"
                    name="organizer_contact"
                    value={formData.organizer_contact}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="e.g., info@example.com or (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Ticketing */}
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                Ticketing
              </h2>

              <div className="space-y-4">
                {/* Free Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_free"
                    name="is_free"
                    checked={formData.is_free}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-saffron-600"
                  />
                  <label htmlFor="is_free" className="text-sm font-medium text-gray-700">
                    This is a free event
                  </label>
                </div>

                {!formData.is_free && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price / Ticket Cost
                    </label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      placeholder="e.g., $25 or $15-$50"
                    />
                  </div>
                )}

                {/* Ticket URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ticket / Registration URL
                  </label>
                  <input
                    type="url"
                    name="ticket_url"
                    value={formData.ticket_url}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="e.g., https://eventbrite.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                Additional Details
              </h2>

              <div className="space-y-4">
                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="e.g., https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: JPG or PNG, 800x600 or larger
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Event'}
              </button>
              <Link href="/events" className="btn-secondary flex-1 text-center">
                Cancel
              </Link>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Note:</span> Your event will be reviewed by our
                team before being published. You'll receive an email confirmation.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function EventSubmitPage() {
  return (
    <AuthGuard>
      <EventSubmitForm />
    </AuthGuard>
  );
}
