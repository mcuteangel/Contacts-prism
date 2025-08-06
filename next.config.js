/** @type {import("next").NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/custom-fields", destination: "/tools/custom-fields", permanent: true },
      { source: "/custom-fields-global", destination: "/tools/custom-fields", permanent: true }
    ];
  }
};
module.exports = nextConfig;
