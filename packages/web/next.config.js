/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@desi-connect/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
