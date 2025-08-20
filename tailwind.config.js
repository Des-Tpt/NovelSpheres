// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {  // ← Đổi từ export const thành module.exports
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'w1080': '1080px',
      },
      fontFamily: {
        inter: ['var(--font-inter)'],
        times: ['"Times New Roman"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}