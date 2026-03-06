import Link from 'next/link';
import { METRO_CONTENT } from '@/lib/metro-content';

export default function MetrosIndexPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Top Indian Diaspora Metro Areas
        </h1>
        <p className="mt-3 text-lg text-gray-600 max-w-3xl">
          Discover the largest and most vibrant Indian communities across the United States.
          From Silicon Valley to the streets of Jackson Heights, explore what makes each metro
          area special for the Desi community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {METRO_CONTENT.map((metro) => (
          <Link
            key={metro.slug}
            href={`/metros/${metro.slug}`}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {metro.city}
                    {metro.city !== metro.state && (
                      <span className="text-gray-400 font-normal text-base ml-2">
                        {metro.stateCode}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-orange-600 font-medium mt-1">{metro.headline}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-lg font-bold text-orange-600">{metro.indianPopulation}</div>
                  <div className="text-xs text-gray-500">Indian Population</div>
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                {metro.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {metro.topCuisines.slice(0, 3).map((cuisine) => (
                  <span
                    key={cuisine}
                    className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full"
                  >
                    {cuisine}
                  </span>
                ))}
                {metro.neighborhoods.slice(0, 2).map((hood) => (
                  <span
                    key={hood}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                  >
                    {hood}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
