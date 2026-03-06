# Desi Connect USA - Page Files Created

This document outlines all the Next.js page files created for the Desi Connect USA community platform.

## Project Structure

```
src/app/
├── page.tsx                          # Homepage
├── businesses/
│   ├── page.tsx                      # Business Directory (Client Component)
│   └── [id]/page.tsx                 # Business Detail (Server Component)
├── jobs/
│   └── page.tsx                      # Job Board (Client Component)
├── news/
│   ├── page.tsx                      # News Feed (Client Component)
│   └── [id]/page.tsx                 # News Article Detail (Server Component)
├── immigration/
│   └── page.tsx                      # Immigration Hub (Server Component)
├── deals/
│   └── page.tsx                      # Hot Deals (Client Component)
└── events/
    └── page.tsx                      # Community Events (Client Component)
```

## File Details

### 1. **src/app/page.tsx** - Homepage
**Type:** Server Component (with async data fetching)

**Features:**
- Hero section with gradient background (saffron/forest colors)
- 6 main content sections:
  - Trending News (4 articles grid)
  - Featured Businesses (6 businesses grid)
  - Latest Jobs (6 jobs grid)
  - Upcoming Events (4 events grid)
  - Hot Deals (4 deals grid)
- Each section has "View All →" links to respective pages
- Server-side data fetching using `apiClient`
- Responsive grid layouts with proper spacing
- Proper error handling with fallback empty states

**Key Imports:**
```typescript
import { apiClient } from '@/lib/api-client'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import Card components from '@/components/cards/'
```

### 2. **src/app/businesses/page.tsx** - Business Directory
**Type:** Client Component ('use client')

**Features:**
- Full-page title with gradient background
- Three-level filtering system:
  - SearchBar for text search
  - CategoryFilter using BUSINESS_CATEGORIES
  - CitySelector for metro area filtering
- Grid display (responsive: 2 cols on mobile, 3 cols on desktop)
- Pagination support with page navigation
- Loading states with skeleton placeholders
- Error handling with user-friendly messages
- Empty state when no results found
- Results counter showing current range

**Interactivity:**
- Live search filtering
- Category and city selection resets pagination
- Smooth page scrolling on pagination
- Client-side API calls to `/api/businesses`

### 3. **src/app/businesses/[id]/page.tsx** - Business Detail
**Type:** Server Component with dynamic routing

**Features:**
- Hero section with business image (or gradient placeholder)
- Business metadata display:
  - Name, category badge, rating with review count
  - Business description
  - Operating hours
- Contact & Location sidebar:
  - Full address with Google Maps directions link
  - Phone number with tel: link
  - Email with mailto: link
  - Website link
- Business info card with additional metadata
- Back to directory navigation link
- SEO-optimized with generateMetadata

**Dynamic Features:**
- notFound() handling for invalid IDs
- Google Maps integration for directions
- Metadata generation from business data

### 4. **src/app/jobs/page.tsx** - Job Board
**Type:** Client Component ('use client')

**Features:**
- Prominent gradient header (forest green colors)
- Advanced filtering:
  - SearchBar for job title/company/skills
  - Job Type filter (FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE)
  - CitySelector for location
  - H-1B Sponsor checkbox toggle
  - OPT Friendly checkbox toggle
- List layout (cards stacked vertically)
- Pagination support
- Loading states with skeleton placeholders
- Results counter

**Target Audience:** Indian professionals seeking visa-friendly employment

### 5. **src/app/news/page.tsx** - News Feed
**Type:** Client Component ('use client')

**Features:**
- News-focused header with blue gradient
- Two-level filtering:
  - CategoryFilter using NEWS_CATEGORIES
  - CitySelector for location-specific news
- Grid layout (4 columns on desktop)
- Pagination with scroll-to-top on page change
- Search functionality (client-side)
- Loading states and error handling
- Empty state messaging

**Categories Supported:**
- Immigration, Community, Business, Technology
- Lifestyle, Events, Deals, Politics

### 6. **src/app/news/[id]/page.tsx** - News Article Detail
**Type:** Server Component with dynamic routing

**Features:**
- Article header section with:
  - Category badge
  - Title (large, bold)
  - Source attribution with link
  - Publication date
- Share buttons (Twitter, Facebook)
- Featured image display (responsive)
- Article content sections:
  - Summary (highlighted in blue box)
  - Full content (with line breaks preserved)
  - Source fallback link if full content unavailable
- Tags display (comma-separated)
- Article metadata section:
  - Category, view count, publication date
- CTA section with link back to news feed
- SEO-optimized with generateMetadata
- notFound() handling

**Share Integration:**
- Twitter share with pre-filled text and URL
- Facebook share with URL
- Proper URL encoding for both platforms

### 7. **src/app/immigration/page.tsx** - Immigration Hub
**Type:** Server Component (with async data fetching)

**Features:**
- Hero section with authoritative design
- Quick Links grid (4 cards):
  - H-1B Updates 💼
  - Green Card News 🟢
  - OPT/CPT Info 📋
  - Citizenship Path 🇺🇸
- Latest Immigration News section:
  - Fetches immigration-category articles
  - Grid layout (3 columns)
  - Link to view all immigration news
- Immigration Consultants Directory:
  - Consultant card display with:
    - Name and specialization
    - Verification badge
    - Fraud alert warning (if applicable)
    - Location, rating, review count
    - Email and phone action buttons
  - Link to full consultancy directory
- Helpful Resources section (4 resources):
  - USCIS, State Department, AILA, NRI.com
  - Each with description and external link
- CTA section encouraging consultant connection

**Special Handling:**
- Fraud alert display for consultancies with alerts
- Verification badges for verified consultants
- External links with target="_blank" and rel="noopener noreferrer"

### 8. **src/app/deals/page.tsx** - Hot Deals
**Type:** Client Component ('use client')

**Features:**
- Red/orange gradient header
- Filtering options:
  - CitySelector for location-specific deals
  - "Expiring within 30 days" toggle for urgent deals
- Grid layout (4 columns on desktop)
- Pagination support
- Client-side filtering for expiring deals
- Loading states and error handling
- Empty state messaging

**Date Handling:**
- Filters deals expiring between now and 30 days from now
- Compares current date with deal expiry_date

### 9. **src/app/events/page.tsx** - Community Events
**Type:** Client Component ('use client')

**Features:**
- Purple/pink gradient header
- Multi-level filtering:
  - CitySelector for location
  - Category dropdown (Cultural, Professional, Religious, Social, etc.)
  - Virtual Events Only toggle
- Grid layout (4 columns on desktop)
- Pagination support
- Real-time filtering combinations
- Loading and error states

**Event Categories:**
- Cultural, Professional, Religious, Social
- Educational, Sports, Fundraiser, Other

## Common Patterns Used

### Data Fetching

**Server Components (page.tsx, [id]/page.tsx):**
```typescript
async function fetchData() {
  try {
    return await apiClient.getX({ params });
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

**Client Components:**
```typescript
useEffect(() => {
  const fetch = async () => {
    const response = await fetch(`${baseUrl}/endpoint?${params}`);
    const data: ApiResponse<T[]> = await response.json();
    setState(data.data || []);
  };
}, [dependencies]);
```

### Styling Classes Used

- `.container-page` - Max-width container with responsive padding
- `.btn-primary` - Primary action button (saffron background)
- `.btn-secondary` - Secondary action button (white/gray)
- `.card` - Card component with border and shadow
- `.section-heading` - Large section titles
- `.section-subheading` - Section subtitles
- Tailwind utilities for responsive design and colors

### Error Handling

All pages include:
- Try-catch blocks for API calls
- Error state UI with user-friendly messages
- Empty state messaging when no results
- Loading skeleton states (animate-pulse)
- notFound() for dynamic pages with invalid IDs

### SEO Optimization

- Server components use `generateMetadata` for dynamic pages
- Layout.tsx provides base metadata
- OpenGraph tags for social sharing
- Proper title templates

## Component Dependencies

All pages expect these components to be available:

**From @/components/cards/:**
- BusinessCard
- NewsCard
- JobCard
- EventCard
- DealCard

**From @/components/ui/:**
- SearchBar
- CategoryFilter
- CitySelector
- Pagination

These components are not included in this file set but are referenced and expected to exist.

## API Integration

All pages use the apiClient from `src/lib/api-client.ts` which handles:
- Reading from NoCodeBackend
- Query parameter building
- Error handling with custom ApiError class
- ISR (Incremental Static Regeneration) with 60-second revalidation

## Browser Support

- Modern browsers (ES2020+)
- Mobile-responsive design
- Smooth scrolling enabled globally
- Touch-friendly interactive elements

## Performance Considerations

- Server components for initial page load optimization
- Client components for interactive filtering
- ISR caching on server components (60s)
- Pagination to prevent large data transfers
- Image lazy loading via Next.js Image optimization (potential)
- CSS classes for consistent styling and bundle size reduction

## Future Enhancements

Consider adding:
- Advanced search with autocomplete
- Favorites/saved items
- User accounts and preferences
- Share to WhatsApp/Telegram
- Push notifications for new deals
- Map view for businesses and events
- Calendar view for events
- Related items sections on detail pages
