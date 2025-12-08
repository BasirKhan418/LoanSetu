/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/profiles/**"
      }
    ],
    // OR (simple version)
    // domains: ["example.com"],
  },
};

export default nextConfig;
