'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS, METRO_AREAS, SITE_NAME, WHATSAPP_BOT_URL } from '@/lib/constants';
import CitySelector from '@/components/ui/CitySelector';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="container-page">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-saffron-600">
              🇮🇳
            </div>
            <span className="hidden font-heading text-xl font-bold text-gray-900 sm:inline">
              {SITE_NAME}
            </span>
            <span className="font-heading text-lg font-bold text-gray-900 sm:hidden">
              Desi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-saffron-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: City selector, WhatsApp button, Mobile menu toggle */}
          <div className="flex items-center gap-3">
            {/* City Selector */}
            <div className="hidden lg:block">
              <CitySelector
                value={selectedCity}
                onSelect={setSelectedCity}
              />
            </div>

            {/* WhatsApp CTA Button */}
            <a
              href={WHATSAPP_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center justify-center rounded-lg bg-saffron-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-saffron-600 sm:inline-flex"
            >
              Join WhatsApp
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-gray-200 py-4 md:hidden">
            <div className="space-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-saffron-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile: City Selector */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <CitySelector
                value={selectedCity}
                onSelect={(city) => {
                  setSelectedCity(city);
                  setMobileMenuOpen(false);
                }}
              />
            </div>

            {/* Mobile: WhatsApp Button */}
            <div className="mt-4">
              <a
                href={WHATSAPP_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center"
              >
                Join WhatsApp Community
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
