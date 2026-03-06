# Quick Reference - Desi Connect USA Page Files

## File Locations

| Page | Path | Type | Purpose |
|------|------|------|---------|
| Home | `src/app/page.tsx` | Server | Landing page with all featured content |
| Businesses | `src/app/businesses/page.tsx` | Client | Business directory with search/filter |
| Business Detail | `src/app/businesses/[id]/page.tsx` | Server | Individual business profile |
| Jobs | `src/app/jobs/page.tsx` | Client | Job board with H-1B/OPT filters |
| News | `src/app/news/page.tsx` | Client | News feed with category/city filters |
| News Detail | `src/app/news/[id]/page.tsx` | Server | Individual article with sharing |
| Immigration | `src/app/immigration/page.tsx` | Server | Immigration hub with resources |
| Deals | `src/app/deals/page.tsx` | Client | Hot deals with expiry filtering |
| Events | `src/app/events/page.tsx` | Client | Community events with category filter |

## Data Flow Diagrams

### Server Component Flow (Homepage, Detail Pages)
```
page.tsx (Server)
    ↓
fetchData() async function
    ↓
apiClient.getX()
    ↓
fetch from NoCodeBackend
    ↓
return JSX with data
```

### Client Component Flow (Directory, Feed Pages)
```
page.tsx ('use client')
    ↓
useState for filters & results
    ↓
useEffect listening to [search, filters, page]
    ↓
fetch(baseUrl + params)
    ↓
setData from response
    ↓
render with loading/error states
```

## Component Hierarchy

Every page follows this structure:

```
<div className="w-full">
  {/* Hero/Header Section */}
  <section className="bg-gradient...">
    <div className="container-page">
      <h1>Title</h1>
      <p>Subtitle</p>
    </div>
  </section>

  {/* Filters Section (client components only) */}
  <section className="border-b border-gray-200 py-8">
    {/* SearchBar, CategoryFilter, CitySelector */}
  </section>

  {/* Results Section */}
  <section className="py-16 sm:py-24">
    <div className="container-page">
      {/* Results counter */}
      {/* Loading state */}
      {/* Error state */}
      {/* Grid/List of cards */}
      {/* Empty state */}
      {/* Pagination */}
    </div>
  </section>

  {/* Optional CTA Section */}
  <section>
    {/* Call to action */}
  </section>
</div>
```

## Color Scheme by Page

| Page | Primary Color | Gradient |
|------|---------------|----------|
| Home | Saffron/Orange | saffron-500 → orange-400 → forest-600 |
| Businesses | Saffron | saffron-500 → orange-400 |
| Jobs | Forest Green | forest-600 → forest-500 |
| News | Blue | blue-600 → blue-500 |
| Immigration | Blue | blue-600 → blue-500 |
| Deals | Red/Orange | red-500 → orange-500 |
| Events | Purple/Pink | purple-600 → pink-500 |

## Filter Patterns

### Search Only
```typescript
<SearchBar onSearch={handleSearch} placeholder="..." />
```

### Category + City
```typescript
<CategoryFilter categories={BUSINESS_CATEGORIES} selected={category} onSelect={handleCategorySelect} />
<CitySelector value={city} onSelect={handleCitySelect} />
```

### Checkbox Toggles
```typescript
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} />
  <span>Label</span>
</label>
```

### Dropdown Filter
```typescript
<select value={category} onChange={(e) => setCategory(e.target.value)}>
  <option value="">All</option>
  {items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
</select>
```

## API Response Handling

```typescript
// Server Component
try {
  const data = await apiClient.getX({ params });
  // Use data directly
} catch (error) {
  console.error('Error:', error);
  // Return empty array or null
}

// Client Component
const response = await fetch(url);
const data: ApiResponse<T[]> = await response.json();
setData(data.data || []);
setTotalPages(data.pagination?.totalPages || 1);
```

## Key States & Props

### Client Component Common States
```typescript
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [search, setSearch] = useState('');
const [filter, setFilter] = useState('');
```

### Loading State Pattern
```typescript
{loading && (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="card h-64 animate-pulse bg-gray-100" />
    ))}
  </div>
)}
```

### Error State Pattern
```typescript
{error && !loading && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
    <p className="font-semibold">Error loading data</p>
    <p className="text-sm">{error}</p>
  </div>
)}
```

### Empty State Pattern
```typescript
{!loading && data.length === 0 && !error && (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
    <h3 className="text-lg font-semibold text-gray-900">No items found</h3>
    <p className="mt-2 text-gray-600">Try adjusting your filters</p>
  </div>
)}
```

## Environment Variables Required

```bash
NEXT_PUBLIC_NOCODEBACKEND_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=https://desiconnectusa.com
```

## Next Steps

1. **Create Component Files** - Build the card and UI components referenced
2. **Test API Integration** - Ensure API endpoints match method signatures
3. **Add Loading States** - Replace animate-pulse with actual skeleton components
4. **Implement Error Recovery** - Add retry buttons for failed requests
5. **Add Analytics** - Track page views and user interactions
6. **SEO Enhancement** - Add structured data (JSON-LD) for search engines
7. **Performance** - Implement image optimization with Next.js Image component

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Component not found" | Create missing card/UI components in src/components/ |
| API returns 404 | Check endpoint names match apiClient methods |
| Filters not resetting page | Add `setPage(1)` in all filter handlers |
| Pagination scroll not working | Add `window.scrollTo({ top: 0 })` in page handler |
| Hydration errors | Ensure no date.now() or random values in JSX |
| Images not loading | Check if image URLs are absolute (include protocol) |

## File Statistics

- **Total Files Created:** 9 page files
- **Server Components:** 4 (homepage, 2 detail pages, immigration)
- **Client Components:** 5 (directories, feeds, deals, events)
- **Total Lines of Code:** ~1,500+ lines
- **TypeScript Coverage:** 100%
- **Responsive Breakpoints:** Mobile, Tablet (sm), Desktop (lg)
