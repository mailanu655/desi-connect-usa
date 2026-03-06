import Link from 'next/link';
import { SITE_NAME, WHATSAPP_BOT_URL } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="container-page py-12 lg:py-16">
        {/* Footer Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About Section */}
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              About {SITE_NAME}
            </h3>
            <p className="mt-4 text-sm">
              The #1 hub for the Indian diaspora in America. We connect you with community
              resources, job opportunities, news, and local businesses.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="#"
                className="text-gray-400 transition-colors hover:text-saffron-500"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333H16V2.169a26.108 26.108 0 00-3.815-.385c-3.815 0-6.185 2.328-6.185 6.303V8z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 transition-colors hover:text-saffron-500"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 transition-colors hover:text-saffron-500"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-saffron-500">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/businesses" className="transition-colors hover:text-saffron-500">
                  Business Directory
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="transition-colors hover:text-saffron-500">
                  Job Listings
                </Link>
              </li>
              <li>
                <Link href="/news" className="transition-colors hover:text-saffron-500">
                  Community News
                </Link>
              </li>
              <li>
                <Link href="/events" className="transition-colors hover:text-saffron-500">
                  Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              Resources
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/immigration" className="transition-colors hover:text-saffron-500">
                  Immigration Guide
                </Link>
              </li>
              <li>
                <Link href="/deals" className="transition-colors hover:text-saffron-500">
                  Exclusive Deals
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-saffron-500">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-saffron-500">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-saffron-500">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              Connect With Us
            </h3>
            <p className="mt-4 text-sm">
              Join our WhatsApp community for instant updates, events, and networking opportunities.
            </p>
            <a
              href={WHATSAPP_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-4 inline-flex gap-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.719.738 5.377 2.138 7.747L2.885 23.987l8.368-2.192a9.873 9.873 0 004.766 1.213h.005c5.432 0 9.847-4.413 9.847-9.846 0-2.63-.674-5.11-1.95-7.32a9.865 9.865 0 00-7.866-4.062zM19.073 18.588c-1.425 1.424-3.318 2.208-5.332 2.208h-.003a8.882 8.882 0 01-4.255-1.07l-.305-.162-3.159.828.842-3.07-.198-.315a8.868 8.868 0 011.358-5.665c1.426-1.426 3.318-2.21 5.333-2.21 2.014 0 3.908.784 5.334 2.209 1.426 1.426 2.209 3.32 2.209 5.333 0 2.015-.784 3.91-2.209 5.336" />
              </svg>
              Join WhatsApp Community
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-gray-800"></div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-xs text-gray-400 sm:flex-row">
          <p>&copy; {currentYear} {SITE_NAME}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-saffron-500">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-saffron-500">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-saffron-500">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
