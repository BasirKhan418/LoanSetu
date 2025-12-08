/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/profiles/**"
      },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/profile/**"
      }
    ],
  },
};

export default nextConfig;
