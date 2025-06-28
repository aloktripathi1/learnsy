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
}

export default nextConfig