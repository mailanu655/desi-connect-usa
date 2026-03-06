import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
const mockReplace = jest.fn();
const mockGet = jest.fn().mockReturnValue(null);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <div data-href={href} {...rest}>
      {children}
    </div>
  );
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.scrollTo
window.scrollTo = jest.fn();

import SearchPage from '@/app/search/page';

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockGet.mockReturnValue(null);

    // Default: trending returns empty, search returns empty
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/search/trending')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ trending: [], period: 'weekly' }),
        });
      }
      if (url.includes('/api/search?')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [],
              query: 'test',
              total: 0,
              page: 1,
              limit: 20,
              total_pages: 0,
              took_ms: 5,
              facets: { content_types: [], cities: [], categories: [] },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('should export as a function', () => {
    expect(typeof SearchPage).toBe('function');
  });

  it('should render without crashing', () => {
    render(<SearchPage />);
    expect(screen.getByText('Search Desi Connect USA')).toBeInTheDocument();
  });

  it('should render the search form', () => {
    render(<SearchPage />);
    expect(screen.getByTestId('search-form')).toBeInTheDocument();
  });

  it('should render the search input', () => {
    render(<SearchPage />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should render the search button', () => {
    render(<SearchPage />);
    expect(screen.getByTestId('search-button')).toBeInTheDocument();
  });

  it('should have correct placeholder text', () => {
    render(<SearchPage />);
    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute(
      'placeholder',
      'Search businesses, jobs, events, deals, news...'
    );
  });

  it('should show empty state when no query', () => {
    render(<SearchPage />);
    expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
  });

  it('should fetch trending searches on mount', () => {
    render(<SearchPage />);
    expect(mockFetch).toHaveBeenCalledWith('/api/search/trending');
  });

  it('should read initial query from URL params', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'q') return 'indian food';
      return null;
    });
    render(<SearchPage />);
    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input.value).toBe('indian food');
  });

  it('should render search button with text', () => {
    render(<SearchPage />);
    expect(screen.getByTestId('search-button')).toHaveTextContent('Search');
  });
});
