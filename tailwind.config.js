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
            serif: ['Crimson Text', 'serif'],
            sans: ['Inter', 'sans-serif'],
        }
    },
  },
  plugins: [],
};
