/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@desi-connect/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  typescript: {
    // Skip type checking during build — errors are caught by IDE/CI lint step
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build — errors are caught by IDE/CI lint step
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
