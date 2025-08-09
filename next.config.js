/** @type {import("next").NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/custom-fields", destination: "/tools/custom-fields", permanent: true },
      { source: "/custom-fields-global", destination: "/tools/custom-fields", permanent: true }
    ];
  },
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: "@dyad-sh/nextjs-webpack-component-tagger",
      });
    }
    return config;
  },
};
module.exports = nextConfig;