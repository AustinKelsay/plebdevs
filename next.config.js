const removeImports = require("next-remove-imports")();

module.exports = removeImports({
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'secure.gravatar.com', 'plebdevs-three.vercel.app', 'plebdevs.com', 'plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com', 'avatars.githubusercontent.com'],
  },
  webpack(config, options) {
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/cron',
        destination: '/api/cron',
      },
      {
        source: "/.well-known/nostr.json",
        destination: "/api/nip05",
      },
      {
        source: '/.well-known/lnurlp/:slug',
        destination: '/api/lightning-address/lnurlp/:slug',
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/.well-known/:slug*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization"
          }
        ]
      },
      {
        source: "/api/:slug*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.BACKEND_URL
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; frame-ancestors 'none';",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
        ],
      },
    ];
  },
  env: {
    KV_URL: process.env.NODE_ENV !== 'production'
      ? process.env.REDIS_URL
      : process.env.KV_URL,
    KV_REST_API_URL: process.env.NODE_ENV !== 'production'
      ? process.env.REDIS_URL
      : process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.NODE_ENV !== 'production'
      ? 'dummy_token'
      : process.env.KV_REST_API_TOKEN,
    KV_REST_API_READ_ONLY_TOKEN: process.env.NODE_ENV !== 'production'
      ? 'dummy_token'
      : process.env.KV_REST_API_READ_ONLY_TOKEN,
  },
});