const removeImports = require("next-remove-imports")();

module.exports = removeImports({
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'secure.gravatar.com', 'plebdevs-three.vercel.app'],
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