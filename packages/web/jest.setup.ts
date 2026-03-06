import '@testing-library/jest-dom';

// Suppress console errors from expected test rejections
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress unhandled rejection errors from mock rejections in tests
    const message = args[0]?.toString?.() || '';
    const errorMessage = args[0]?.message?.toString?.() || '';
    if (
      message.includes('Logout failed') ||
      message.includes('Refresh failed') ||
      errorMessage.includes('Logout failed') ||
      errorMessage.includes('Refresh failed')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Handle unhandled promise rejections in tests
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason) => {
    const message = reason?.message?.toString?.() || reason?.toString?.() || '';
    // Silently ignore expected test rejections
    if (!message.includes('Logout failed') && !message.includes('Refresh failed')) {
      // Re-throw if not an expected error
      throw reason;
    }
  });
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
  redirect: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockedLink({ children, href, ...props }: any) {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'a',
      props: {
        href,
        ...props,
        children,
      },
    };
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function MockedImage({ src, alt, ...props }: any) {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: {
        src,
        alt,
        ...props,
      },
    };
  };
});
