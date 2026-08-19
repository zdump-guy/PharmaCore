const path = require('path');
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  i18n,
  images: {
    domains: ['drive.google.com', 'lh3.googleusercontent.com', 'i.imgur.com', 'res.cloudinary.com'],
  },
};

module.exports = nextConfig;
