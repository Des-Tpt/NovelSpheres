// tailwind.config.js
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
            inter: ['var(--font-inter)'],
            times: ['"Times New Roman"', 'serif'],
            sans: ['Inter', 'sans-serif'],
        }
    },
    typography: {
      DEFAULT: {
        css: {
          h1: {
            fontSize: '3.5rem',
            fontFamily: 'var(--font-inter)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
