/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './page.tsx',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'mirra-orange': '#E37C60',
        'mirra-cream': '#FAF8F5',
        'mirra-dark': '#2B2B2B',
      },
    },
  },
  plugins: [],
}

