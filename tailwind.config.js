/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        ocean: '#0F766E',
        aqua: '#14B8A6',
        'app-bg': '#F8FAFC',
        surface: '#FFFFFF',
        line: '#E2E8F0',
        success: '#16A34A',
        warning: '#EA580C',
        caution: '#CA8A04',
        danger: '#DC2626',
        info: '#2563EB',
        purple: '#7C3AED',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
