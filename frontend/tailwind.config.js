/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        alpha: {
          bg: '#0a0e1a',
          card: '#111827',
          elevated: '#1a2235',
          border: '#1e2d3d',
          green: '#00d4aa',
          red: '#ff4757',
        },
      },
    },
  },
  plugins: [],
}
