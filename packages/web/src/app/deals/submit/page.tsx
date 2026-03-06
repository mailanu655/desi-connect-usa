'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { METRO_AREAS } from '@/lib/constants';

const DEAL_TYPES = [
  { value: 'percentage', label: 'Percentage Off' },
  { value: 'flat', label: 'Flat Discount' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'freebie', label: 'Free Item' },
  { value: 'bundle', label: 'Bundle Deal' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'special', label: 'Special Offer' },
];

function DealSubmitForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    title: '',
    description: '',
    deal_type: '',
    discount_value: '',
    coupon_code: '',
    expiry_date: '',
    city: '',
    state: '',
    image_url: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate required fields
    if (
      !formData.business_name ||
      !formData.title ||
      !formData.description ||
      !formData.deal_type ||
      !formData.expiry_date ||
      !formData.city ||
      !formData.state
    ) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate expiry date is in the future
    const expiryDate = new Date(formData.expiry_date);
    if (expiryDate <= new Date()) {
      setError('Expiry date must be in the future');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/deals/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          discount_value: formData.discount_value || undefined,
          coupon_code: formData.coupon_code || undefined,
          image_url: formData.image_url || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to submit deal. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/deals');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-500 to-orange-500 py-16 sm:py-24">
        <div className="container-page">
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-white/80">
              <li>
                <Link href="/" className="hover:text-white">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/deals" className="hover:text-white">Deals</Link>
              </li>
              <li>/</li>
              <li className="text-white font-medium">Submit a Deal</li>
            </ol>
          </nav>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Submit a Deal
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Share exclusive deals and offers from your business with the community.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page max-w-3xl">
          {/* Success Banner */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4" role="alert">
              <p className="font-semibold text-green-800">Deal submitted successfully!</p>
              <p className="text-sm text-green-700">
                Your deal has been submitted for review. Redirecting to deals page...
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Business Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>

              <div className="mb-4">
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Your business name"
                />
              </div>
            </div>

            {/* Deal Details */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Details</h2>

              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., 20% Off All Biryani Platters"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe the deal, terms, and conditions..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div>
                  <label htmlFor="deal_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="deal_type"
                    name="deal_type"
                    value={formData.deal_type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select deal type</option>
                    {DEAL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="text"
                    id="discount_value"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., 20% or $10"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="coupon_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    id="coupon_code"
                    name="coupon_code"
                    value={formData.coupon_code}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., DESI20"
                  />
                </div>

                <div>
                  <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    required
                    min={today}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="City name"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select state</option>
                    {METRO_AREAS.map((area) => (
                      <option key={area.slug} value={area.state}>
                        {area.state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://example.com/deal-image.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Provide a direct URL to an image for your deal (optional).
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All deal submissions are reviewed by our moderation team before being published.
                This usually takes 24–48 hours.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/deals"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || success}
                className="px-8 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 transition"
              >
                {loading ? 'Submitting...' : 'Submit Deal'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function DealSubmitPage() {
  return (
    <AuthGuard>
      <DealSubmitForm />
    </AuthGuard>
  );
}
