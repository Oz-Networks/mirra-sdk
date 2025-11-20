module.exports = {
  output: 'export',
  distDir: '.next',
  images: {
    unoptimized: true // Required for static export
  },
  env: {
    NEXT_PUBLIC_TEMPLATE_API_KEY: process.env.NEXT_PUBLIC_TEMPLATE_API_KEY,
    NEXT_PUBLIC_OWNER_NAME: process.env.NEXT_PUBLIC_OWNER_NAME,
    NEXT_PUBLIC_OWNER_TIMEZONE: process.env.NEXT_PUBLIC_OWNER_TIMEZONE,
  }
};

