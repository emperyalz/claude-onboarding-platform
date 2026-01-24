/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'claude-orange': '#CC785C',
        'claude-cream': '#F5F0E8',
        'claude-dark': '#1A1A1A',
      },
    },
  },
  plugins: [],
}
