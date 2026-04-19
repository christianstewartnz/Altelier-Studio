/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['framer-motion'],
  // pdfkit and archiver read files from node_modules at runtime —
  // exclude them from bundling so Node resolves paths correctly.
  serverExternalPackages: ['pdfkit', 'archiver'],
}

export default nextConfig
