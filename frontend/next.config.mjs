/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Proxy /api/* to the FastAPI backend — keeps the backend URL server-side only
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
