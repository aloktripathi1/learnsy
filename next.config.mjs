/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['i.ytimg.com', 'img.youtube.com'],
  },
  // Ensure static export for Netlify
  output: 'export',
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    // Fix for Supabase realtime client WebSocket dependency warning
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push('ws');
    }
    return config;
  },
}

export default nextConfig