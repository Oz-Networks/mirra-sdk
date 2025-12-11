module.exports = {
  output: 'export',
  distDir: '.next',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_MIRRA_API_KEY: process.env.NEXT_PUBLIC_MIRRA_API_KEY,
    NEXT_PUBLIC_OWNER_ID: process.env.NEXT_PUBLIC_OWNER_ID,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  }
};
