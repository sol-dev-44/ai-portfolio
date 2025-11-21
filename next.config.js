/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/projects/solana',
        destination: 'https://sol-watch-eight.vercel.app/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;