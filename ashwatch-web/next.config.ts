import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/github',
        destination: 'https://github.com/IlhamGhaza',
        permanent: false,
      },
      {
        source: '/creator',
        destination: 'https://github.com/IlhamGhaza',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
