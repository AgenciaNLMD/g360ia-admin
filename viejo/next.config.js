/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "app.gestion360ia.com.ar" }],
        destination: "/portal",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
