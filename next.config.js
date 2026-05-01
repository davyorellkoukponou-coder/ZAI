/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  // Allow importing SVG from DiceBear
  webpack(config) {
    return config
  },
}

module.exports = nextConfig
